"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getListing, fitAnalysis, Listing } from "@/lib/api";

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

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [fit, setFit] = useState<FitResult | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [loadingFit, setLoadingFit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const l = await getListing(id);
        setListing(l);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load listing");
      } finally {
        setLoadingListing(false);
      }
    }
    if (id) load();
  }, [id]);

  async function analyzeFit() {
    if (!listing) return;
    setLoadingFit(true);
    try {
      const result = await fitAnalysis(listing.listing_id);
      setFit(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fit analysis failed");
    } finally {
      setLoadingFit(false);
    }
  }

  if (loadingListing) {
    return <div className="max-w-3xl mx-auto px-6 py-10 text-slate-500">Loading listing...</div>;
  }

  if (error || !listing) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error || "Listing not found"}</div>
      </div>
    );
  }

  const enrich = listing._enrichment;
  const review = listing._review_summary;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-500 mb-6">
        <Link href="/listings" className="hover:text-slate-700">← Listings</Link>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 text-white mb-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 text-sm mb-1">{listing.source} · {listing.status}</p>
            <h1 className="text-2xl font-bold">
              {enrich?.building_name || listing.address?.split(",")[0] || "Unknown Building"}
            </h1>
            <p className="text-slate-300 mt-1">{listing.address}</p>
            <p className="text-slate-400 text-sm">{listing.neighborhood}, {listing.borough}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-emerald-400">
              ${listing.price_monthly?.toLocaleString()}
            </p>
            <p className="text-slate-400 text-sm">/month</p>
            {listing.no_fee && (
              <span className="inline-block mt-1 bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30">
                No Fee
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick facts grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Type", value: "Studio · 1 Bath" },
          { label: "Size", value: listing.sq_ft ? `${listing.sq_ft} sqft` : "N/A" },
          { label: "Floor", value: listing.floor != null && listing.floor > 0 ? `Floor ${listing.floor}` : "N/A" },
          { label: "Laundry", value: { in_unit: "In-unit", in_building: "In-building", none: "None", unknown: "Unknown" }[listing.laundry || "unknown"] || listing.laundry || "N/A" },
          { label: "Pets", value: listing.pet_policy === "pets_allowed" || listing.pet_policy === "dogs_ok" ? "Allowed" : listing.pet_policy === "no_pets" ? "Not allowed" : listing.pet_policy || "Unknown" },
          { label: "Available", value: listing.available_date || "Contact" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-slate-800 font-medium text-sm">{value}</p>
          </div>
        ))}
      </div>

      {/* Transit */}
      {enrich && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-slate-800 mb-3">🚇 Transit & Commute</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            {enrich.subway_lines && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Subway Lines</p>
                <div className="flex gap-1">
                  {enrich.subway_lines.map((l) => (
                    <span key={l} className="bg-slate-800 text-white text-xs px-1.5 py-0.5 rounded font-mono">{l}</span>
                  ))}
                </div>
              </div>
            )}
            {enrich.subway_station && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Station</p>
                <p className="font-medium text-slate-700">{enrich.subway_station}</p>
              </div>
            )}
            {enrich.subway_walk_min && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Walk to Station</p>
                <p className="font-medium text-slate-700">{enrich.subway_walk_min} min</p>
              </div>
            )}
            {enrich.commute_midtown_min && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Commute to Midtown</p>
                <p className="font-bold text-emerald-700">~{enrich.commute_midtown_min} min</p>
              </div>
            )}
          </div>
          {enrich.neighborhood_vibe && (
            <p className="text-sm text-slate-500 mt-3 italic">"{enrich.neighborhood_vibe}"</p>
          )}
        </div>
      )}

      {/* Amenities */}
      {listing.amenities && listing.amenities.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-slate-800 mb-3">✨ Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {listing.amenities.map((a) => (
              <span key={a} className="bg-slate-100 text-slate-700 text-sm px-3 py-1 rounded-full border border-slate-200">
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {listing.description_snippet && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-slate-800 mb-2">About this listing</h2>
          <p className="text-slate-600 text-sm leading-relaxed">{listing.description_snippet}</p>
        </div>
      )}

      {/* Review signal */}
      {review?.overall_signal && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800">📋 Review Signal</h2>
            {review.google_rating && <span className="text-slate-700 font-bold">⭐ {review.google_rating}</span>}
          </div>
          <p className="text-sm text-slate-600 mb-2">
            Overall: <span className="font-semibold capitalize">{review.overall_signal?.replace(/_/g, " ")}</span>
          </p>
          {review.risk_flags && review.risk_flags.length > 0 && (
            <div className="space-y-2 mt-2">
              {review.risk_flags.map((f, i) => (
                <div key={i} className={`text-xs p-2 rounded-lg border ${f.severity === "high" ? "bg-red-50 border-red-200 text-red-700" : f.severity === "medium" ? "bg-yellow-50 border-yellow-200 text-yellow-700" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                  ⚠️ {f.type}: {f.evidence}
                </div>
              ))}
            </div>
          )}
          <Link href={`/research/${listing.listing_id}`} className="text-xs text-emerald-600 hover:underline mt-2 inline-block">
            Full Review Intelligence →
          </Link>
        </div>
      )}

      {/* Fit Analysis */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">🎯 Fit Analysis</h2>
          {!fit && (
            <button
              onClick={analyzeFit}
              disabled={loadingFit}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {loadingFit ? "Analyzing..." : "Analyze Fit"}
            </button>
          )}
        </div>

        {!fit && !loadingFit && (
          <p className="text-slate-500 text-sm">
            Click "Analyze Fit" to get a personalized fit score based on your search profile.
          </p>
        )}

        {loadingFit && (
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
          </div>
        )}

        {fit && (
          <div className="space-y-4">
            {/* Score */}
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${fit.fit_score >= 80 ? "text-emerald-600" : fit.fit_score >= 65 ? "text-blue-600" : "text-yellow-600"}`}>
                {fit.fit_score}
              </div>
              <div>
                <p className="font-semibold text-slate-800">{fit.fit_label}</p>
                <div className="w-48 bg-slate-100 rounded-full h-2 mt-1">
                  <div
                    className={`h-2 rounded-full ${fit.fit_score >= 80 ? "bg-emerald-500" : fit.fit_score >= 65 ? "bg-blue-500" : "bg-yellow-500"}`}
                    style={{ width: `${fit.fit_score}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(fit.score_breakdown).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-600 w-24 text-xs">{SCORE_LABELS[key] || key}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(val / 25) * 100}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 w-8 text-right">{val}/25</span>
                </div>
              ))}
            </div>

            {/* Why it matches */}
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Why it matches</p>
              <ul className="space-y-1">
                {fit.why_it_matches.map((reason, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span> {reason}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tradeoffs */}
            <div>
              <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-2">Tradeoffs</p>
              <ul className="space-y-1">
                {fit.tradeoffs.map((t, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">⚡</span> {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Verdict */}
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 italic border border-slate-200">
              {fit.verdict}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href={`/compare?ids=${listing.listing_id}`}
          className="flex-1 text-center border border-slate-200 text-slate-700 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors"
        >
          Add to Compare
        </Link>
        <Link
          href={`/research/${listing.listing_id}`}
          className="flex-1 text-center border border-slate-200 text-slate-700 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors"
        >
          Review Research
        </Link>
        <Link
          href={`/notify?ids=${listing.listing_id}`}
          className="flex-1 text-center bg-slate-900 text-white py-2.5 rounded-lg text-sm hover:bg-slate-700 transition-colors"
        >
          Push to WeCom
        </Link>
      </div>
    </div>
  );
}
