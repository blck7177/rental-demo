"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getListings, compareListings, Listing } from "@/lib/api";

interface CompareResult {
  summary: string;
  verdicts: Record<string, string>;
  verdict_explanations: Record<string, string>;
  comparison_rows: { category: string; values: Record<string, string>; winner?: string }[];
  bottom_line: string;
}

const VERDICT_CONFIG = [
  { key: "best_overall", icon: "🏆", label: "Best Overall", color: "bg-emerald-500" },
  { key: "best_value", icon: "💰", label: "Best Value", color: "bg-blue-500" },
  { key: "lowest_risk", icon: "🛡️", label: "Lowest Risk", color: "bg-purple-500" },
  { key: "best_commute", icon: "🚇", label: "Best Commute", color: "bg-amber-500" },
  { key: "best_amenities", icon: "✨", label: "Best Amenities", color: "bg-pink-500" },
];

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
    getListings().then((d) => setAllListings(d.listings)).finally(() => setLoadingListings(false));
  }, []);

  async function runComparison() {
    if (selectedIds.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const data = await compareListings(selectedIds);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Comparison failed");
    } finally {
      setLoading(false);
    }
  }

  function toggleId(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev);
  }

  function getListingName(id: string) {
    const l = allListings.find((x) => x.listing_id === id);
    return l?._enrichment?.building_name || l?.address?.split(",")[0] || id.slice(-8);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Side-by-Side Comparison</h1>
        <p className="text-slate-500 text-sm mt-1">Select 2–3 listings for AI-powered decision analysis</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8">
        <p className="text-sm font-semibold text-slate-700 mb-3">Select listings ({selectedIds.length}/3)</p>
        {loadingListings ? <div className="text-slate-500 text-sm">Loading...</div> : (
          <div className="flex flex-wrap gap-2 mb-4">
            {allListings.map((l) => {
              const name = l._enrichment?.building_name || l.address?.split(",")[0] || l.listing_id;
              const isSel = selectedIds.includes(l.listing_id);
              return (
                <button key={l.listing_id} onClick={() => toggleId(l.listing_id)}
                  className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${isSel ? "bg-emerald-600 text-white border-emerald-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  {isSel && "✓ "}${l.price_monthly?.toLocaleString()} {name?.substring(0, 18)}
                </button>
              );
            })}
          </div>
        )}
        <button onClick={runComparison} disabled={selectedIds.length < 2 || loading}
          className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
          {loading ? "Generating..." : `Compare ${selectedIds.length} Listings →`}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">{error}</div>}

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Decision Summary */}
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-4">Decision Summary</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {VERDICT_CONFIG.map(({ key, icon, label, color }, i) => {
                  const winnerId = result.verdicts?.[key];
                  if (!winnerId) return null;
                  return (
                    <motion.div key={key} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                      className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                      <div className={`w-9 h-9 ${color} rounded-full flex items-center justify-center text-white text-lg mx-auto mb-2`}>{icon}</div>
                      <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
                      <p className="text-sm font-bold text-slate-800 leading-tight">{getListingName(winnerId)}</p>
                      {result.verdict_explanations?.[key] && <p className="text-xs text-slate-500 mt-1 leading-tight">{result.verdict_explanations[key]}</p>}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <p className="text-slate-600 text-sm">{result.summary}</p>
            </div>

            {/* Comparison table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="text-left px-5 py-3 font-semibold w-36 text-xs uppercase tracking-wide">Category</th>
                    {selectedIds.map((id) => (
                      <th key={id} className="text-left px-4 py-3 font-semibold">
                        <Link href={`/listings/${id}`} className="hover:text-emerald-400 transition-colors">{getListingName(id)}</Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.comparison_rows?.map((row, i) => (
                    <tr key={row.category} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-5 py-3 text-slate-500 text-xs uppercase tracking-wide font-medium">{row.category}</td>
                      {selectedIds.map((id) => {
                        const isWinner = row.winner === id;
                        return <td key={id} className={`px-4 py-3 ${isWinner ? "text-emerald-700 font-semibold" : "text-slate-700"}`}>{isWinner && "✓ "}{row.values?.[id] || "N/A"}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Final recommendation */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-5">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-2">Final Recommendation</p>
              <p className="text-emerald-800 font-semibold text-base">{result.bottom_line}</p>
            </motion.div>

            <div className="flex justify-end">
              <Link href={`/notify?ids=${selectedIds.join(",")}`} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-slate-700 transition-colors">
                Send Shortlist to WeCom →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ComparePage() {
  return <Suspense fallback={<div className="p-10 text-slate-500">Loading...</div>}><CompareContent /></Suspense>;
}
