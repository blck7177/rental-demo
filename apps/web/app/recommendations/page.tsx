"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getListings, compareListings, Listing } from "@/lib/api";
import Link from "next/link";
import RiskBadge from "@/components/RiskBadge";

interface CompareResult {
  summary: string;
  verdicts: Record<string, string>;
  verdict_explanations: Record<string, string>;
  bottom_line: string;
}

const VERDICT_CONFIG = [
  { key: "best_overall", icon: "🏆", label: "Best Overall", accent: { border: "border-emerald-300", bg: "bg-emerald-50", badge: "bg-emerald-600", text: "text-emerald-700" } },
  { key: "best_value", icon: "💰", label: "Best Value", accent: { border: "border-blue-300", bg: "bg-blue-50", badge: "bg-blue-600", text: "text-blue-700" } },
  { key: "lowest_risk", icon: "🛡️", label: "Lowest Risk", accent: { border: "border-purple-300", bg: "bg-purple-50", badge: "bg-purple-600", text: "text-purple-700" } },
];

export default function RecommendationsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [top3, setTop3] = useState<{ listing: Listing; key: string; icon: string; label: string; explanation?: string; accent: typeof VERDICT_CONFIG[0]["accent"] }[]>([]);
  const [comparison, setComparison] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getListings();
        const all = data.listings;
        setListings(all);

        // Pick top 3: prefer enriched + reviewed, sort by commute efficiency + review quality
        const candidates = all
          .filter((l) => l.price_monthly <= 3200 && l._enrichment)
          .sort((a, b) => {
            const scoreA = (a._enrichment?.commute_midtown_min ? 30 - (a._enrichment.commute_midtown_min || 30) : 0) +
              (a._review_summary ? 10 : 0) + (a.doorman ? 5 : 0) + (a.laundry === "in_unit" ? 5 : 0);
            const scoreB = (b._enrichment?.commute_midtown_min ? 30 - (b._enrichment.commute_midtown_min || 30) : 0) +
              (b._review_summary ? 10 : 0) + (b.doorman ? 5 : 0) + (b.laundry === "in_unit" ? 5 : 0);
            return scoreB - scoreA;
          })
          .slice(0, 5);

        const top3ids = candidates.slice(0, 3).map((l) => l.listing_id);

        let comp: CompareResult | null = null;
        if (top3ids.length >= 2) {
          try {
            comp = await compareListings(top3ids);
            setComparison(comp);
          } catch { /* comparison optional */ }
        }

        // Map verdicts to listings
        const result = VERDICT_CONFIG.map(({ key, icon, label, accent }) => {
          const winnerId = comp?.verdicts?.[key];
          const listing = winnerId ? all.find((l) => l.listing_id === winnerId) : candidates[VERDICT_CONFIG.findIndex((v) => v.key === key)];
          return { key, icon, label, accent, listing: listing || candidates[0], explanation: comp?.verdict_explanations?.[key] };
        }).filter((r) => r.listing);

        setTop3(result as typeof top3);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load — make sure the API is running on port 8000.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-slate-100 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-5">{[1,2,3].map((i) => <div key={i} className="h-72 bg-slate-100 rounded-xl" />)}</div>
        </div>
      </div>
    );
  }

  const compareIds = top3.map((r) => r.listing?.listing_id).filter(Boolean).join(",");

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-slate-900">Top Recommendations</h1>
          <p className="text-slate-500 text-sm mt-1">
            AI-selected top 3 based on commute, budget, management quality, and amenities
          </p>
        </motion.div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">{error}</div>}

      {/* Top 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {top3.map(({ key, icon, label, accent, listing, explanation }, idx) => {
          if (!listing) return null;
          const enrich = listing._enrichment;
          const review = listing._review_summary;

          return (
            <motion.div key={key}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
              className={`bg-white border-2 ${accent.border} rounded-2xl flex flex-col overflow-hidden`}>
              <div className={`${accent.bg} px-4 py-2.5 flex items-center gap-2 border-b ${accent.border}`}>
                <span className="text-xl">{icon}</span>
                <span className={`text-sm font-bold ${accent.text}`}>{label}</span>
              </div>

              <div className="px-4 pt-4 pb-2">
                <h3 className="font-semibold text-slate-900 text-base leading-tight">
                  {enrich?.building_name || listing.address?.split(",")[0]}
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">{listing.neighborhood}</p>
                <p className={`text-2xl font-bold mt-2 ${accent.text}`}>
                  ${listing.price_monthly?.toLocaleString()}
                  <span className="text-xs font-normal text-slate-400">/mo</span>
                </p>
                {listing.no_fee && <span className="text-xs text-emerald-600 font-medium">No Fee</span>}
              </div>

              <div className="px-4 py-2 space-y-1.5 flex-1">
                {enrich?.commute_midtown_min && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span>🚇</span>
                    <span className="font-medium">{enrich.commute_midtown_min} min</span>
                    <span className="text-slate-400">to Midtown</span>
                  </div>
                )}
                {listing.laundry && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span>🧺</span>
                    <span>{{ in_unit: "In-unit laundry", in_building: "Building laundry" }[listing.laundry] || listing.laundry}</span>
                  </div>
                )}
                {listing.doorman && (
                  <div className="flex items-center gap-2 text-xs text-slate-600"><span>🏢</span><span>Doorman building</span></div>
                )}
                {review?.google_rating && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span>⭐</span><span className="font-medium">{review.google_rating}</span><span className="text-slate-400">Google</span>
                  </div>
                )}
                {review?.risk_flags?.[0] && <RiskBadge severity={review.risk_flags[0].severity} type={review.risk_flags[0].type} />}
              </div>

              {explanation && (
                <div className={`mx-4 mb-3 mt-1 ${accent.bg} rounded-lg p-2.5 text-xs ${accent.text}`}>{explanation}</div>
              )}

              <div className="px-4 pb-4 flex gap-2">
                <Link href={`/listings/${listing.listing_id}`}
                  className="flex-1 text-center bg-slate-900 text-white text-xs py-2 rounded-lg hover:bg-slate-700 transition-colors">
                  View Details
                </Link>
                <Link href={`/research/${listing.listing_id}`}
                  className="px-2.5 py-2 border border-slate-200 text-slate-500 text-xs rounded-lg hover:bg-slate-50 transition-colors" title="Reviews">
                  📋
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* AI Summary */}
      {comparison && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Analysis Summary</p>
            <p className="text-slate-700 text-sm">{comparison.summary}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Bottom Line</p>
            <p className="text-emerald-800 font-medium">{comparison.bottom_line}</p>
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <div className="flex gap-3 mt-8">
        <Link href={`/compare?ids=${compareIds}`}
          className="flex-1 text-center bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors">
          Compare These 3 Side-by-Side →
        </Link>
        <Link href={`/notify?ids=${compareIds}`}
          className="flex-1 text-center border border-slate-200 text-slate-700 py-3 rounded-xl hover:bg-slate-50 transition-colors">
          Push Shortlist to WeCom
        </Link>
      </div>

      <div className="mt-4 text-center">
        <Link href="/listings" className="text-sm text-slate-400 hover:text-slate-600">Browse all {listings.length} listings →</Link>
      </div>
    </div>
  );
}
