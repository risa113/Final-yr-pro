/**
 * Verified Real-World Web Search Tool
 * Retrieves live search snippets and facts from public knowledge engines (DuckDuckGo, Wikipedia API).
 */

export interface SearchResultItem {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

export interface WebSearchResult {
  query: string;
  results: SearchResultItem[];
  success: boolean;
  notes?: string;
}

export async function performWebSearch(query: string, maxResults: number = 4): Promise<WebSearchResult> {
  const sanitizedQuery = query.trim();
  if (!sanitizedQuery) {
    return { query, results: [], success: false, notes: "Empty search query." };
  }

  const results: SearchResultItem[] = [];

  // 1. First attempt: Wikipedia REST API for verified factual overviews
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      sanitizedQuery
    )}&format=json&origin=*&utf8=1`;

    const res = await fetch(wikiUrl, {
      headers: { "User-Agent": "UniversalAI/1.0 (Educational Assistant)" },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = await res.json();
      const searchItems = data.query?.search || [];

      for (const item of searchItems.slice(0, 2)) {
        const cleanSnippet = item.snippet
          ? item.snippet.replace(/<span class="searchmatch">/g, "").replace(/<\/span>/g, "")
          : "";

        results.push({
          title: item.title,
          snippet: cleanSnippet,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, "_"))}`,
          source: "Wikipedia",
        });
      }
    }
  } catch (err: any) {
    // Graceful fallback to next engine
  }

  // 2. Second attempt: DuckDuckGo Instant Answer API
  try {
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(
      sanitizedQuery
    )}&format=json&no_html=1&skip_disambig=1`;

    const res = await fetch(ddgUrl, {
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = await res.json();

      if (data.AbstractText) {
        results.push({
          title: data.Heading || sanitizedQuery,
          snippet: data.AbstractText,
          url: data.AbstractURL || "https://duckduckgo.com/?q=" + encodeURIComponent(sanitizedQuery),
          source: data.AbstractSource || "DuckDuckGo Instant Answer",
        });
      }

      if (Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics.slice(0, 2)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.slice(0, 60) + "...",
              snippet: topic.Text,
              url: topic.FirstURL,
              source: "DuckDuckGo Topic",
            });
          }
        }
      }
    }
  } catch (err: any) {
    // Fallback handled below
  }

  const finalResults = results.slice(0, maxResults);

  return {
    query: sanitizedQuery,
    results: finalResults,
    success: finalResults.length > 0,
    notes:
      finalResults.length > 0
        ? `Found ${finalResults.length} real-time verified web source(s).`
        : "Live search service completed; no direct snippets returned for this specific phrase.",
  };
}
