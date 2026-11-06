import React, { Suspense } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";

export const metadata = {
  title: "Tarik AI Nutrition Chatbot – Context-Aware AI Food & Nutrition Platform",
  description:
    "Fast, intelligent conversational AI assistant with real-time streaming across general knowledge and specialized clinical nutrition.",
};

export default function AssistantPage() {
  return (
    <div className="w-full">
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Tarik AI...</div>}>
        <ChatContainer />
      </Suspense>
    </div>
  );
}
