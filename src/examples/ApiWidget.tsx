/**
 * Example: API Widget Component
 *
 * Demonstrates how to use the api-client utility to fetch data
 * from an external API with caching.
 *
 * This component fetches a random quote from an API and displays it.
 * The data is cached for 5 minutes to reduce API calls.
 */

import { useState, useEffect } from "react";
import { cachedFetch, clearCache } from "../utils/api-client";

interface Quote {
  content: string;
  author: string;
}

export function ApiWidget() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuote = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await cachedFetch<Quote>("https://api.quotable.io/random", {
        ttl: 300000, // 5 minutes
        cacheKey: "random-quote",
      });
      setQuote(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quote");
    } finally {
      setLoading(false);
    }
  };

  const refreshQuote = () => {
    // Clear cache and fetch fresh quote
    clearCache("random-quote");
    loadQuote();
  };

  useEffect(() => {
    loadQuote();
  }, []);

  return (
    <div className="border border-theme-gray rounded-lg p-6 bg-theme-light">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-theme-dark">Random Quote</h3>
        <button
          onClick={refreshQuote}
          disabled={loading}
          className="px-3 py-1 text-sm bg-theme-secondary text-theme-light rounded hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="text-red-600 dark:text-red-400 mb-4">
          Error: {error}
        </div>
      )}

      {quote && !loading && (
        <div>
          <blockquote className="text-lg italic text-theme-dark mb-2">
            "{quote.content}"
          </blockquote>
          <p className="text-sm text-theme-darkgray">— {quote.author}</p>
        </div>
      )}

      {loading && !quote && (
        <div className="text-theme-darkgray">Loading quote...</div>
      )}

      <div className="mt-4 text-xs text-theme-gray">
        <p>This quote is cached for 5 minutes.</p>
      </div>
    </div>
  );
}
