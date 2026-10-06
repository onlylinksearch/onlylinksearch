module.exports = async function handler(req, res) {
  const q = String(req.query.q || "").trim();
  const page = Math.max(
    0,
    Math.min(9, parseInt(req.query.page || "0", 10) || 0)
  );

  if (!q) {
    return res.status(400).json({ error: "Missing search query" });
  }

  const apiKey = process.env.BRAVE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "BRAVE_API_KEY is not configured" });
  }

  try {
    const url = new URL(
      "https://api.search.brave.com/res/v1/web/search"
    );

    url.searchParams.set("q", q);
    url.searchParams.set("count", "20");
    url.searchParams.set("offset", String(page));
    url.searchParams.set("country", "US");
    url.searchParams.set("search_lang", "en");
    url.searchParams.set("safesearch", "moderate");

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": apiKey
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Brave Search request failed"
      });
    }

    const results = (data.web?.results || []).map(item => ({
      title: item.title || "",
      url: item.url || "",
      description: item.description || ""
    }));

    return res.status(200).json({
      results,
      moreResultsAvailable:
        Boolean(data.query?.more_results_available)
    });
  } catch {
    return res.status(500).json({ error: "Search failed" });
  }
};
