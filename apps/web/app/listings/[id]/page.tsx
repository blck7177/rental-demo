"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getListing, fitAnalysis, Listing } from "@/lib/api";
import ScoreRing from "@/components/ScoreRing";
import RiskBadge from "@/components/RiskBadge";
import SourceBadge from "@/components/SourceBadge";

type Tab = "overview" | "fit" | "review" | "evidence";

interface FitResult {
  fit_score: number;
  fit_label: string;
  why_it_matches: string[];
  tradeoffs: string[];
  verdict: string;
  score_breakdown: Record<string, number>;
}

const SCORE_LABELS: Record<string, string> = {
  price_fit: "💰 Price",
  location_fit: "📍 Location",
  amenity_fit: "✨ Amenities",
  lifestyle_fit: "🧘 Lifestyle",
};

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "fit", label: "Fit Analysis" },
  { id: "review", label: "Review Intel" },
  { id: "evidence", label: "Source Evidence" },
];

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [fit, setFit] = useState<FitResult | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loadingListing, setLoadingListing] = useState(true);
  const [loadingFit, setLoadingFit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getListing(id).then(setListing).catch((e) => setError(e.message)).finally(() => setLoadingListing(false));
  }, [id]);

  async function analyzeFit() {
    if (!listing) return;
    setLoadingFit(true);
    try {
      const result = await fitAnalysis(listing.listing_id);
      setFit(result);
      setTab("fit");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fit analysis failed");
    } finally {
      setLoadingFit(false);
    }
  }

  if (loadingListing) return <div className="max-w-3xl mx-auto px-6 py-10 text-slate-500">Loading...</div>;
  if (!listing) return <div className="max-w-3xl mx-auto px-6 py-10"><div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error || "Listing not found"}</div></div>;

  const enrich = listing._enrichment;
  const review = listing._review_summary;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="text-sm text-slate-500 mb-5"><Link href="/listings" className="hover:text-slate-700">← Listings</Link></div>

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 text-white mb-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-slate-400 text-xs mb-1">{listing.source} · {listing.status}</p>
            <h1 className="text-2xl font-bold">{enrich?.building_name || listing.address?.split(",")[0] || "Unknown"}</h1>
            <p className="text-slate-300 mt-1 text-sm">{listing.address}</p>
            <p className="text-slate-400 text-xs">{listing.neighborhood}, {listing.borough}</p>
            {enrich?.management_company && <p className="text-slate-500 text-xs mt-0.5">Managed by {enrich.management_company}</p>}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-3xl font-bold text-emerald-400">${listing.price_monthly?.toLocaleString()}</p>
            <p className="text-slate-400 text-xs">/month</p>
            {listing.no_fee && <span className="inline-block mt-1 bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30">No Fee</span>}
          </div>
        </div>
      </div>

      {/* Quick facts */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Type", value: "Studio · 1 Bath" },
          { label: "Size", value: listing.sq_ft ? `${listing.sq_ft} sqft` : "N/A" },
          { label: "Floor", value: listing.floor ? `Floor ${listing.floor}` : "N/A" },
          { label: "Laundry", value: { in_unit: "In-unit", in_building: "In-building", none: "None" }[listing.laundry || ""] || "N/A" },
          { label: "Pets", value: listing.pet_policy === "pets_allowed" || listing.pet_policy === "dogs_ok" ? "Allowed" : listing.pet_policy === "no_pets" ? "Not allowed" : listing.pet_policy || "Unknown" },
          { label: "Available", value: listing.available_date || "Contact" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t.id ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

          {tab === "overview" && (
            <div className="space-y-5">
              {enrich && (
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h2 className="font-semibold text-slate-800 mb-3">🚇 Transit & Commute</h2>
                  <div className="flex flex-wrap gap-5 text-sm">
                    {enrich.subway_lines && <div><p className="text-xs text-slate-500 mb-1">Lines</p><div className="flex gap-1">{enrich.subway_lines.map((l) => <span key={l} className="bg-slate-800 text-white text-xs px-1.5 py-0.5 rounded font-mono">{l}</span>)}</div></div>}
                    {enrich.subway_station && <div><p className="text-xs text-slate-500 mb-1">Station</p><p className="font-medium text-slate-700">{enrich.subway_station}</p></div>}
                    {enrich.subway_walk_min && <div><p className="text-xs text-slate-500 mb-1">Walk</p><p className="font-medium text-slate-700">{enrich.subway_walk_min} min</p></div>}
                    {enrich.commute_midtown_min && <div><p className="text-xs text-slate-500 mb-1">Midtown</p><p className="font-bold text-emerald-700">~{enrich.commute_midtown_min} min</p></div>}
                  </div>
                  {enrich.neighborhood_vibe && <p className="text-sm text-slate-500 mt-3 italic">"{enrich.neighborhood_vibe}"</p>}
                </div>
              )}
              {listing.amenities?.length ? (
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h2 className="font-semibold text-slate-800 mb-3">✨ Amenities</h2>
                  <div className="flex flex-wrap gap-2">{listing.amenities.map((a) => <span key={a} className="bg-slate-100 text-slate-700 text-sm px-3 py-1 rounded-full border border-slate-200">{a}</span>)}</div>
                </div>
              ) : null}
              {listing.description_snippet && (
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h2 className="font-semibold text-slate-800 mb-2">About</h2>
                  <p className="text-slate-600 text-sm leading-relaxed">{listing.description_snippet}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={analyzeFit} disabled={loadingFit}
                  className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                  {loadingFit ? "Analyzing..." : "Run Fit Analysis →"}
                </button>
                <Link href={`/research/${listing.listing_id}`} className="flex-1 text-center border border-slate-200 text-slate-700 py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                  Review Research
                </Link>
              </div>
            </div>
          )}

          {tab === "fit" && (
            <div className="space-y-5">
              {!fit && !loadingFit && (
                <div className="text-center py-10">
                  <p className="text-slate-500 mb-4">Run a personalized fit analysis.</p>
                  <button onClick={analyzeFit} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors">Analyze Fit</button>
                </div>
              )}
              {loadingFit && <div className="space-y-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />)}</div>}
              {fit && (
                <>
                  <div className="flex items-center gap-5 bg-white border border-slate-200 rounded-xl p-5">
                    <ScoreRing score={fit.fit_score} size={80} strokeWidth={7} />
                    <div>
                      <p className="text-2xl font-bold text-slate-800">{fit.fit_label}</p>
                      <p className="text-slate-500 text-sm mt-0.5">{fit.fit_score}/100 personalized fit</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(fit.score_breakdown).map(([key, val]) => (
                      <div key={key} className="bg-white border border-slate-200 rounded-xl p-3">
                        <p className="text-xs text-slate-500 mb-1.5">{SCORE_LABELS[key] || key}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-2">
                            <motion.div className="bg-emerald-500 h-2 rounded-full" initial={{ width: 0 }} animate={{ width: `${(val / 25) * 100}%` }} transition={{ duration: 0.6 }} />
                          </div>
                          <span className="text-xs font-bold text-slate-600">{val}/25</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-2">Why it matches</p>
                    <ul className="space-y-1.5">{fit.why_it_matches.map((r, i) => <li key={i} className="text-sm text-slate-700 flex gap-2"><span className="text-emerald-500 mt-0.5">✓</span>{r}</li>)}</ul>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">Tradeoffs</p>
                    <ul className="space-y-1.5">{fit.tradeoffs.map((t, i) => <li key={i} className="text-sm text-slate-700 flex gap-2"><span className="text-amber-500 mt-0.5">⚡</span>{t}</li>)}</ul>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 italic">{fit.verdict}</div>
                </>
              )}
            </div>
          )}

          {tab === "review" && (
            <div className="space-y-4">
              {review ? (
                <>
                  <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-0.5">Overall Signal</p>
                      <p className={`font-bold capitalize text-lg ${review.overall_signal?.includes("positive") ? "text-emerald-700" : "text-yellow-700"}`}>
                        {review.overall_signal?.replace(/_/g, " ")}
                      </p>
                    </div>
                    {review.google_rating && <div className="text-right"><p className="text-2xl font-bold text-slate-800">⭐ {review.google_rating}</p><p className="text-xs text-slate-400">Google rating</p></div>}
                  </div>
                  {review.risk_flags && review.risk_flags.length > 0 && (
                    <div className="space-y-2">
                      {review.risk_flags.map((f, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                          <RiskBadge severity={f.severity} type={f.type} />
                          <p className="text-sm text-slate-600 flex-1">{f.evidence}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <Link href={`/research/${listing.listing_id}`} className="block text-center bg-slate-900 text-white py-2.5 rounded-xl text-sm hover:bg-slate-700 transition-colors">
                    Full Review Intelligence →
                  </Link>
                </>
              ) : (
                <div className="text-center py-10">
                  <p className="text-slate-500 mb-4">No review data available.</p>
                  <Link href={`/research/${listing.listing_id}`} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm">Research This Building</Link>
                </div>
              )}
            </div>
          )}

          {tab === "evidence" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="font-semibold text-slate-800 mb-4">Data Provenance</h2>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "Listing ID", value: listing.listing_id, mono: true },
                    { label: "Source", value: <SourceBadge source={listing.source} /> },
                    { label: "URL", value: <a href={listing.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs break-all">{listing.url}</a> },
                    { label: "Fetched At", value: listing.fetched_at ? new Date(listing.fetched_at).toLocaleString() : "N/A" },
                    { label: "Run ID", value: listing.run_id, mono: true },
                    { label: "Quality Tier", value: <span className={`font-semibold capitalize ${listing.quality_tier === "high" ? "text-emerald-600" : listing.quality_tier === "low" ? "text-red-500" : "text-yellow-600"}`}>{listing.quality_tier}</span> },
                    { label: "Status", value: listing.status },
                  ].map(({ label, value, mono }) => (
                    <div key={label} className="flex gap-4 items-start border-b border-slate-50 pb-2 last:border-0">
                      <span className="text-slate-500 w-28 flex-shrink-0">{label}</span>
                      <span className={mono ? "font-mono text-xs text-slate-800" : ""}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              {enrich && (
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h2 className="font-semibold text-slate-800 mb-3">Building Data</h2>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: "Building", value: enrich.building_name },
                      { label: "Manager", value: enrich.management_company },
                      { label: "Year Built", value: enrich.year_built },
                      { label: "Total Units", value: enrich.total_units },
                      { label: "Coordinates", value: enrich.lat && enrich.lng ? `${enrich.lat}, ${enrich.lng}` : null },
                    ].filter(({ value }) => value).map(({ label, value }) => (
                      <div key={label} className="flex gap-4 border-b border-slate-50 pb-2 last:border-0">
                        <span className="text-slate-500 w-24 flex-shrink-0">{label}</span>
                        <span className="text-slate-800">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3 mt-8 pt-5 border-t border-slate-100">
        <Link href={`/compare?ids=${listing.listing_id}`} className="flex-1 text-center border border-slate-200 text-slate-700 py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors">Add to Compare</Link>
        <Link href={`/notify?ids=${listing.listing_id}`} className="flex-1 text-center bg-slate-900 text-white py-2.5 rounded-xl text-sm hover:bg-slate-700 transition-colors">Push to WeCom</Link>
      </div>
    </div>
  );
}
