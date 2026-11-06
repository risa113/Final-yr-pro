/**
 * Document Processor & RAG Extraction Tool
 * Ingests text documents, code snippets, CSV data, and base64 documents.
 */

export interface ProcessedDocument {
  fileName: string;
  fileType: string;
  content: string;
  summary: string;
  totalTokensApprox: number;
}

export function processTextDocument(
  fileName: string,
  rawContent: string,
  fileType: string = "text/plain"
): ProcessedDocument {
  // Clean whitespace and normalize line endings
  const clean = rawContent.replace(/\r\n/g, "\n").trim();
  const wordCount = clean.split(/\s+/).length;
  const approxTokens = Math.ceil(clean.length / 4);

  let summary = `Document "${fileName}" (${fileType}) loaded. Length: ${clean.length} characters, ~${approxTokens} tokens.`;
  if (fileType.includes("csv")) {
    const lines = clean.split("\n");
    summary = `CSV Dataset "${fileName}": ${lines.length} rows, header: [${lines[0]?.slice(0, 80)}]`;
  } else if (fileType.includes("json")) {
    summary = `JSON Document "${fileName}": ~${wordCount} keys/values.`;
  }

  return {
    fileName,
    fileType,
    content: clean,
    summary,
    totalTokensApprox: approxTokens,
  };
}

/**
 * Lightweight RAG: Chunks document text and retrieves the top-K most relevant chunks
 * based on keyword and n-gram overlap with the query.
 */
export function extractRelevantChunks(
  content: string,
  query: string,
  chunkSize: number = 600,
  maxChunks: number = 4
): string[] {
  if (!content) return [];
  if (content.length <= chunkSize * 1.5) {
    return [content];
  }

  // Split by paragraphs or double newlines
  const rawParagraphs = content.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const p of rawParagraphs) {
    if ((currentChunk + "\n\n" + p).length <= chunkSize) {
      currentChunk += (currentChunk ? "\n\n" : "") + p;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = p;
    }
  }
  if (currentChunk) chunks.push(currentChunk);

  // Score chunks by query word matches
  const queryTerms = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (queryTerms.length === 0) {
    return chunks.slice(0, maxChunks);
  }

  const scored = chunks.map((chunk) => {
    const chunkLower = chunk.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      const regex = new RegExp(`\\b${term}\\b`, "g");
      const matches = chunkLower.match(regex);
      if (matches) {
        score += matches.length * (term.length > 4 ? 2 : 1);
      }
    }
    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // If no term matched, return first chunks
  if (scored[0]?.score === 0) {
    return chunks.slice(0, maxChunks);
  }

  return scored.slice(0, maxChunks).map((s) => s.chunk);
}
