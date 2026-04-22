// Tavily search API — optimized for LLM RAG. Use for geopolitical, macro, social sentiment.

type TavilyResult = {
  title: string
  url: string
  content: string
  score: number
  published_date?: string
}

export async function tavilySearch(
  query: string,
  opts: {
    searchDepth?: "basic" | "advanced"
    topic?: "general" | "news" | "finance"
    maxResults?: number
    days?: number
    includeAnswer?: boolean
  } = {},
): Promise<{ answer?: string; results: TavilyResult[] }> {
  const key = process.env.TAVILY_API_KEY
  if (!key) return { results: [] }

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query,
        search_depth: opts.searchDepth ?? "advanced",
        topic: opts.topic ?? "news",
        max_results: opts.maxResults ?? 8,
        days: opts.days ?? 7,
        include_answer: opts.includeAnswer ?? true,
      }),
      // Don't cache too long — news is time-sensitive.
      next: { revalidate: 300 },
    })
    if (!res.ok) return { results: [] }
    const data = (await res.json()) as { answer?: string; results?: TavilyResult[] }
    return { answer: data.answer, results: data.results ?? [] }
  } catch {
    return { results: [] }
  }
}
