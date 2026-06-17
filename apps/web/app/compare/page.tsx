"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getListings, compareListings, Listing } from "@/lib/api";

interface CompareResult {
  summary: string;
  verdicts: Record<string, string>;
  verdict_explanations: Record<string, string>;
  comparison_rows: { category: string; values: Record<string, string>; winner?: string }[];
  bottom_line: string;
  listings: Record<string, unknown>[];
}

const VERDICT_ICONS: Record<string, string> = {
  best_overall: "🏆",
  best_value: "💰",
  lowest_risk: "🛡️",
  best_commute: "🚇",
  best_amenities: "✨",
};

function CompareContent() {
  const searchParams = useSearchParams();
  const initialIds = searchParams.get("ids")?.split(",").filter(Boolean) || [];

  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds.slice(0, 3));
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingListings, setLoadingListings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getListings()
      .then((d) => setAllListings(d.listings))
      .finally(() => setLoadingListings(false));
  }, []);

  async function runComparison() {
    if (selectedIds.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const data = await compareListings(selectedIds);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      setLoading(false);
    }
  }

  function toggleId(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length < 3) return [...prev, id];
      return prev;
    });
  }

  const getListingName = (id: string) => {
    const l = allListings.find((x) => x.listing_id === id);
    return l?._enrichment?.building_name || l?.address?.split(",")[0] || id;
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Side-by-Side Comparison</h1>
        <p className="text-slate-500 text-sm mt-1">Select 2–3 listings to compare with AI verdicts</p>
      </div>

      {/* Listing selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8">
        <h2 className="font-semibold text-slate-800 mb-3 text-sm">Select listings to compare</h2>
        {loadingListings ? (
          <div className="text-slate-500 text-sm">Loading listings...</div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            {allListings.map((l) => {
              const name = l._enrichment?.building_name || l.address?.split(",")[0] || l.listing_id;
              const isSelected = selectedIds.includes(l.listing_id);
              return (
                <button
                  key={l.listing_id}
                  onClick={() => toggleId(l.listing_id)}
                  className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {isSelected && "✓ "}${l.price_monthly?.toLocaleString()} {name?.substring(0, 18)}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">
            {selectedIds.length}/3 selected
          </span>
          <button
            onClick={runComparison}
            disabled={selectedIds.length < 2 || loading}
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Generating comparison..." : `Compare ${selectedIds.length} listings →`}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">{error}</div>
      )}

      {/* Comparison results */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <p className="text-slate-700 text-sm">{result.summary}</p>
          </div>

          {/* Verdicts */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(result.verdicts || {}).map(([key, winnerId]) => {
              if (!winnerId) return null;
              return (
                <div key={key} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">{VERDICT_ICONS[key] || "🏅"}</div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    {key.replace(/_/g, " ")}
                  </p>
                  <p className="text-sm font-bold text-slate-800 leading-tight">
                    {getListingName(winnerId)}
                  </p>
                  {result.verdict_explanations?.[key] && (
                    <p className="text-xs text-slate-500 mt-1 leading-tight">
                      {result.verdict_explanations[key]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Comparison table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="text-left px-5 py-3 font-semibold w-36">Category</th>
                  {selectedIds.map((id) => (
                    <th key={id} className="text-left px-4 py-3 font-semibold">
                      <Link href={`/listings/${id}`} className="hover:text-emerald-400 transition-colors">
                        {getListingName(id)}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(result.comparison_rows || []).map((row, i) => (
                  <tr key={row.category} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">
                      {row.category}
                    </td>
                    {selectedIds.map((id) => {
                      const isWinner = row.winner === id;
                      return (
                        <td
                          key={id}
                          className={`px-4 py-3 ${isWinner ? "text-emerald-700 font-semibold" : "text-slate-700"}`}
                        >
                          {isWinner && "✓ "}
                          {row.values?.[id] || "N/A"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom line */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Bottom Line</p>
            <p className="text-emerald-800 font-medium">{result.bottom_line}</p>
          </div>

          {/* Push to WeCom */}
          <div className="flex justify-end">
            <Link
              href={`/notify?ids=${selectedIds.join(",")}`}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-slate-700 transition-colors"
            >
              Send Shortlist to WeCom →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-10 text-slate-500">Loading...</div>}>
      <CompareContent />
    </Suspense>
  );
}
