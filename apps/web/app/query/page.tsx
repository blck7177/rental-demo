"use client";

import { useState } from "react";
import { nlQuery, Listing } from "@/lib/api";
import ListingCard from "@/components/ListingCard";
import Link from "next/link";

const EXAMPLE_QUERIES = [
  "Show me quiet studios under $3,000 with good Midtown commute",
  "No fee studios near the 7 train, pet friendly",
  "Best value studios under $2,700 in LIC with in-unit laundry",
  "Under $3,200 with doorman and elevator, avoid bad management",
];

export default function QueryPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    parsed: { filters: Record<string, unknown>; ranking_intent: Record<string, unknown>; parsed_summary: string };
    total_results: number;
    results: Listing[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  async function handleSearch(q?: string) {
    const queryText = q || query;
    if (!queryText.trim()) return;
    setQuery(queryText);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await nlQuery(queryText);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Natural Language Search</h1>
        <p className="text-slate-500 text-sm mt-1">
          Describe what you want in plain English — AI parses it into filters and ranks results
        </p>
      </div>

      {/* Search input */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder='e.g. "Show me quiet studios under $3,000 with good commute"'
            className="flex-1 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors min-w-[100px]"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Example queries */}
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => handleSearch(q)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">{error}</div>
      )}

      {/* Parsed query result */}
      {result && (
        <>
          {/* How we parsed your query */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
            <h2 className="font-semibold text-blue-800 mb-2 text-sm">How we parsed your query</h2>
            <p className="text-blue-700 text-sm mb-3">{result.parsed.parsed_summary}</p>
            <div className="grid grid-cols-2 gap-4">
              {/* Filters */}
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Extracted Filters</p>
                <div className="space-y-1">
                  {Object.entries(result.parsed.filters || {})
                    .filter(([, v]) => v != null)
                    .map(([k, v]) => (
                      <div key={k} className="flex gap-2 text-xs">
                        <span className="text-blue-500 font-mono w-24">{k}:</span>
                        <span className="text-blue-800 font-medium">{String(v)}</span>
                      </div>
                    ))}
                  {Object.values(result.parsed.filters || {}).every((v) => v == null) && (
                    <p className="text-blue-500 text-xs">No specific filters extracted — showing all listings ranked by preference</p>
                  )}
                </div>
              </div>
              {/* Ranking */}
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Ranking Priorities</p>
                <div className="space-y-1">
                  {((result.parsed.ranking_intent as { priorities?: string[] })?.priorities || []).map((p: string) => (
                    <span key={p} className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full mr-1">
                      ↑ {p}
                    </span>
                  ))}
                  {((result.parsed.ranking_intent as { avoid?: string[] })?.avoid || []).map((a: string) => (
                    <span key={a} className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full mr-1">
                      ↓ avoid {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results header */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-700 font-semibold">
              {result.total_results} results, ranked by fit
            </p>
            {selected.size >= 2 && (
              <Link
                href={`/compare?ids=${Array.from(selected).join(",")}`}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 transition-colors"
              >
                Compare {selected.size} →
              </Link>
            )}
          </div>

          {/* Results grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {result.results.map((listing, idx) => (
              <div key={listing.listing_id} className="relative">
                {idx < 3 && (
                  <div className={`absolute -top-2 -left-2 z-10 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow ${
                    idx === 0 ? "bg-emerald-500" : idx === 1 ? "bg-blue-500" : "bg-slate-500"
                  }`}>
                    {idx + 1}
                  </div>
                )}
                <ListingCard
                  listing={listing}
                  selected={selected.has(listing.listing_id)}
                  onSelect={toggleSelect}
                  showSelectButton
                />
              </div>
            ))}
          </div>

          {result.total_results === 0 && (
            <div className="text-center py-12 text-slate-500">
              No listings matched your query. Try relaxing the filters.
            </div>
          )}
        </>
      )}
    </div>
  );
}
