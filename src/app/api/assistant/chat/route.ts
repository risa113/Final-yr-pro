import { NextRequest, NextResponse } from "next/server";
import {
  generateTextWithFallback,
  streamTextWithFallback,
  LLMMessage,
  FAST_MODEL,
  DEEP_MODEL,
} from "@/lib/ai/llm-client";
import { buildMasterSystemInstruction } from "@/lib/ai/system-instructions";
import { routeUserQuestion, RoutingDecision } from "@/lib/ai/question-router";
import { executeToolByName, ToolExecutionRecord } from "@/lib/tools";
import { memoryStore, buildBoundedContext } from "@/lib/ai/context-manager";
import { sanitizeAndValidateInput, checkRateLimit } from "@/lib/security/prompt-guard";
import { extractRelevantChunks } from "@/lib/tools/document-processor";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for") || "local_client";
    const rateCheck = checkRateLimit(clientIp, 60, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Rate limit reached. Please wait a moment before sending another message." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      message,
      conversationId: rawConversationId,
      stream = true,
      attachment,
      nutritionContext,
    } = body;

    // 1. Input Validation & Sanitization
    const validation = sanitizeAndValidateInput(message || "");
    if (!validation.isValid && !attachment) {
      return NextResponse.json({ error: validation.flaggedReason || "Invalid message." }, { status: 400 });
    }

    const conversationId = rawConversationId || "conv_default_general";
    const userPrompt = validation.sanitized || (attachment ? `Analyze the attached ${attachment.name || "file"}.` : "");

    // 2. Intelligent Routing & Mode Determination
    const routing: RoutingDecision = routeUserQuestion(userPrompt, !!attachment);
    const toolExecutions: ToolExecutionRecord[] = [];

    // Execute tool only when strictly needed to prevent latency on standard chat
    if (routing.recommendedTool && routing.recommendedTool.toolName !== "none") {
      try {
        const toolRes = await executeToolByName(
          routing.recommendedTool.toolName,
          routing.recommendedTool.params
        );
        toolExecutions.push(toolRes);
      } catch (toolErr: any) {
        console.warn("[Tool Error]:", toolErr.message);
      }
    }

    // 3. Document / RAG Context Processing
    let retrievedDocumentContext = "";
    if (attachment && attachment.type === "file" && attachment.text) {
      const chunks = extractRelevantChunks(attachment.text, userPrompt, 600, 3);
      if (chunks.length > 0) {
        retrievedDocumentContext = `File: ${attachment.name || "Document"}\n` + chunks.join("\n---\n");
      }
    }

    // 4. Selective Nutrition Profile Injection (Only when relevant)
    let nutritionSnippet = "";
    if (routing.requiresNutritionContext && nutritionContext) {
      const remainingCals = Math.max(
        0,
        (nutritionContext.dailyTargets?.calories || 2000) - (nutritionContext.todayConsumed?.calories || 0)
      );
      const remainingProtein = Math.max(
        0,
        (nutritionContext.dailyTargets?.proteinG || 120) - (nutritionContext.todayConsumed?.proteinG || 0)
      );

      nutritionSnippet = `User: ${nutritionContext.userName || "User"} (${nutritionContext.age || 22}y, ${nutritionContext.dietaryType || "vegetarian"}, Allergies: ${nutritionContext.allergies?.join(", ") || "None"}). Remaining Budget: ${remainingCals} kcal, ${remainingProtein}g protein.`;
    }

    // 5. System Instruction optimized by Mode (Fast vs Deep)
    const systemInstruction = buildMasterSystemInstruction({
      userName: nutritionContext?.userName,
      mode: routing.mode,
      hasNutritionContext: routing.requiresNutritionContext && !!nutritionSnippet,
      nutritionContextSnippet: nutritionSnippet,
      retrievedToolContext: toolExecutions
        .map((t) => `[Tool: ${t.toolName} | Input: ${t.input}]\nOutput: ${t.output}`)
        .join("\n\n"),
      retrievedDocumentContext,
    });

    // 6. Sliding Context Window (Fast: 6 messages, Deep: 10 messages)
    const existingMessages = memoryStore.getMessages(conversationId);
    const historyPayload = existingMessages.map((m) => ({
      role: m.senderRole,
      content: m.content,
    }));

    const maxMessages = routing.mode === "fast" ? 6 : 10;
    const messagesToSend: LLMMessage[] = buildBoundedContext(historyPayload, undefined, maxMessages);

    // Build Current User Turn
    const currentParts: any[] = [{ text: userPrompt }];

    if (attachment && attachment.base64 && (attachment.type === "image" || attachment.mimeType === "application/pdf")) {
      const cleanBase64 = attachment.base64.replace(/^data:[\w\/+-]+;base64,/, "");
      currentParts.push({
        inlineData: {
          mimeType: attachment.mimeType || "image/jpeg",
          data: cleanBase64,
        },
      });
    }

    messagesToSend.push({
      role: "user",
      parts: currentParts,
    });

    // Save User message in memory
    memoryStore.addMessage(conversationId, "user", userPrompt, {
      domain: routing.primaryDomain,
      mode: routing.mode,
      toolExecutions,
      hasAttachment: !!attachment,
    });

    // Select primary model based on mode
    const targetModel = routing.mode === "fast" ? FAST_MODEL : DEEP_MODEL;

    // 7. REAL-TIME SERVER-SENT EVENTS (SSE) STREAMING
    if (stream) {
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          let fullReply = "";

          try {
            // Immediately send metadata event for zero-delay UI status
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "meta",
                  domain: routing.primaryDomain,
                  mode: routing.mode,
                  assistantName: "Tarik AI",
                  tools: toolExecutions,
                  conversationId,
                })}\n\n`
              )
            );

            // Stream tokens directly with low-latency model
            const generator = streamTextWithFallback(messagesToSend, {
              model: targetModel,
              systemInstruction,
              temperature: routing.mode === "fast" ? 0.4 : 0.7,
              maxOutputTokens: routing.mode === "fast" ? 1024 : 4096,
            });

            for await (const chunk of generator) {
              fullReply += chunk.text;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "chunk",
                    text: chunk.text,
                  })}\n\n`
                )
              );
            }

            // Save assistant message to memory
            memoryStore.addMessage(conversationId, "assistant", fullReply, {
              domain: routing.primaryDomain,
              mode: routing.mode,
              assistantName: "Tarik AI",
              toolExecutions,
            });

            // Send done event
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "done",
                  fullReply,
                  mode: routing.mode,
                  domain: routing.primaryDomain,
                })}\n\n`
              )
            );
          } catch (streamErr: any) {
            console.error("[Streaming Error]:", streamErr);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "error",
                  error: streamErr.message || "Tarik AI generation was interrupted.",
                })}\n\n`
              )
            );
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    // 8. NON-STREAMING FALLBACK
    const generation = await generateTextWithFallback(messagesToSend, {
      model: targetModel,
      systemInstruction,
      temperature: routing.mode === "fast" ? 0.4 : 0.7,
      maxOutputTokens: routing.mode === "fast" ? 1024 : 4096,
    });

    memoryStore.addMessage(conversationId, "assistant", generation.text, {
      domain: routing.primaryDomain,
      mode: routing.mode,
      assistantName: "Tarik AI",
      toolExecutions,
    });

    return NextResponse.json(
      {
        reply: generation.text,
        domain: routing.primaryDomain,
        mode: routing.mode,
        assistantName: "Tarik AI",
        toolExecutions,
        conversationId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Tarik AI Chat API error:", error);

    if (error.message?.includes("GEMINI_API_KEY")) {
      return NextResponse.json(
        {
          error: "API key is not configured in .env.local. Please configure your key to enable Tarik AI.",
          isBlockedByCredentials: true,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Tarik AI could not formulate a response at this time." },
      { status: 500 }
    );
  }
}
