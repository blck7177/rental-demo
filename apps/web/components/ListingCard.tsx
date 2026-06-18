"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Listing } from "@/lib/api";
import ScoreRing from "./ScoreRing";
import RiskBadge from "./RiskBadge";

const LAUNDRY_LABEL: Record<string, string> = {
  in_unit: "In-unit laundry",
  in_building: "Building laundry",
  none: "No laundry",
  unknown: "Laundry TBD",
};

interface Props {
  listing: Listing;
  selected?: boolean;
  onSelect?: (id: string) => void;
  showSelectButton?: boolean;
  highlight?: boolean;
}

export default function ListingCard({ listing, selected, onSelect, showSelectButton, highlight }: Props) {
  const enrich = listing._enrichment;
  const review = listing._review_summary;
  const fitScore = listing._fit_score;
  const topRiskFlag = review?.risk_flags?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}
      transition={{ duration: 0.2 }}
      className={`bg-slate-900 rounded-xl border flex flex-col transition-all duration-200 ${
        selected
          ? "border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10"
          : highlight
          ? "border-blue-500/40 ring-1 ring-blue-500/20"
          : "border-white/10 hover:border-white/20"
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-750 rounded-t-xl px-5 py-4">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 mb-0.5 uppercase tracking-wide truncate">{listing.source}</p>
            <h3 className="font-semibold text-base leading-tight truncate text-white">
              {enrich?.building_name || listing.address?.split(",")[0] || "Unnamed Building"}
            </h3>
            <p className="text-slate-400 text-sm mt-0.5 truncate">{listing.neighborhood}, {listing.borough}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-emerald-400">${listing.price_monthly?.toLocaleString()}</p>
            <p className="text-slate-500 text-xs">/mo</p>
            {listing.no_fee && (
              <span className="inline-block mt-1 bg-emerald-500/15 text-emerald-400 text-xs px-1.5 py-0.5 rounded border border-emerald-500/25">
                No Fee
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex gap-3 text-xs text-slate-500 flex-wrap">
          <span>Studio · 1 Bath</span>
          {listing.sq_ft && <span>{listing.sq_ft} sqft</span>}
          {listing.floor != null && listing.floor > 0 && <span>Floor {listing.floor}</span>}
        </div>

        {enrich?.subway_lines && enrich.subway_lines.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            <span className="text-slate-500">🚇</span>
            {enrich.subway_lines.map((l) => (
              <span key={l} className="bg-slate-700 text-slate-200 text-xs px-1.5 py-0.5 rounded font-mono border border-white/10">{l}</span>
            ))}
            {enrich.subway_walk_min && <span className="text-slate-500">{enrich.subway_walk_min} min walk</span>}
            {enrich.commute_midtown_min && (
              <span className="text-emerald-400 font-medium ml-auto">~{enrich.commute_midtown_min} min</span>
            )}
          </div>
        )}

        {listing.amenities && listing.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {listing.amenities.slice(0, 4).map((a) => (
              <span key={a} className="bg-white/5 text-slate-400 text-xs px-2 py-0.5 rounded-full border border-white/10">{a}</span>
            ))}
            {listing.amenities.length > 4 && (
              <span className="text-slate-600 text-xs self-center">+{listing.amenities.length - 4}</span>
            )}
          </div>
        )}

        <div className="flex gap-3 text-xs text-slate-500">
          <span>{LAUNDRY_LABEL[listing.laundry || "unknown"]}</span>
          {listing.pet_policy && listing.pet_policy !== "unknown" && (
            <span className={listing.pet_policy === "no_pets" ? "text-red-400" : "text-emerald-400"}>
              {listing.pet_policy === "pets_allowed" || listing.pet_policy === "dogs_ok"
                ? "Pet friendly"
                : listing.pet_policy === "no_pets"
                ? "No pets"
                : listing.pet_policy}
            </span>
          )}
        </div>

        {topRiskFlag ? (
          <div className="flex items-center gap-2">
            <RiskBadge severity={topRiskFlag.severity} type={topRiskFlag.type} />
            {review?.google_rating && <span className="text-xs text-slate-500 ml-auto">⭐ {review.google_rating}</span>}
          </div>
        ) : review?.overall_signal ? (
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium capitalize ${
              review.overall_signal.includes("positive")
                ? "text-emerald-400"
                : review.overall_signal === "mixed"
                ? "text-yellow-400"
                : "text-red-400"
            }`}>
              {review.overall_signal.replace(/_/g, " ")}
            </span>
            {review.google_rating && <span className="text-xs text-slate-500">⭐ {review.google_rating}</span>}
          </div>
        ) : null}

        {fitScore != null && (
          <div className="flex items-center gap-3 mt-auto pt-2 border-t border-white/5">
            <ScoreRing score={fitScore} size={44} strokeWidth={5} />
            <div>
              <p className="text-xs font-semibold text-slate-300">Fit Score</p>
              <p className="text-xs text-slate-500">
                {fitScore >= 80 ? "Excellent Match" : fitScore >= 65 ? "Strong Match" : "Good Match"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex gap-2 border-t border-white/5 pt-3">
        <Link href={`/listings/${listing.listing_id}`}
          className="flex-1 text-center bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs py-2 rounded-lg transition-colors font-medium">
          Details
        </Link>
        {review && (
          <Link href={`/research/${listing.listing_id}`}
            className="px-3 py-2 border border-white/10 text-slate-500 hover:text-slate-300 hover:bg-white/5 text-xs rounded-lg transition-colors"
            title="Review Research">
            📋
          </Link>
        )}
        {showSelectButton && (
          <button onClick={() => onSelect?.(listing.listing_id)}
            className={`px-3 py-2 text-xs rounded-lg transition-all border font-medium ${
              selected
                ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
                : "border-white/10 text-slate-500 hover:text-white hover:bg-white/5"
            }`}>
            {selected ? "✓" : "+"}
          </button>
        )}
      </div>
    </motion.div>
  );
}
