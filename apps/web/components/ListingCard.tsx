"use client";

import Link from "next/link";
import { Listing } from "@/lib/api";

const SIGNAL_COLORS: Record<string, string> = {
  positive: "text-emerald-600 bg-emerald-50 border-emerald-200",
  very_positive: "text-emerald-700 bg-emerald-50 border-emerald-200",
  mixed_positive: "text-blue-600 bg-blue-50 border-blue-200",
  mixed: "text-yellow-700 bg-yellow-50 border-yellow-200",
  mixed_negative: "text-orange-600 bg-orange-50 border-orange-200",
  negative: "text-red-600 bg-red-50 border-red-200",
};

const SIGNAL_LABELS: Record<string, string> = {
  positive: "Positive",
  very_positive: "Very Positive",
  mixed_positive: "Mixed Positive",
  mixed: "Mixed",
  mixed_negative: "Mixed Negative",
  negative: "Negative",
};

interface Props {
  listing: Listing;
  selected?: boolean;
  onSelect?: (id: string) => void;
  showSelectButton?: boolean;
}

export default function ListingCard({ listing, selected, onSelect, showSelectButton }: Props) {
  const enrich = listing._enrichment;
  const review = listing._review_summary;
  const fitScore = listing._fit_score;

  const laundryLabel: Record<string, string> = {
    in_unit: "In-unit laundry",
    in_building: "In-building laundry",
    none: "No laundry",
    unknown: "Laundry unknown",
  };

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow flex flex-col ${
        selected ? "border-emerald-500 ring-2 ring-emerald-200" : "border-slate-200"
      }`}
    >
      {/* Header band */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-xl px-5 py-4 text-white">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-slate-400 mb-0.5 uppercase tracking-wide">
              {listing.source}
            </p>
            <h3 className="font-semibold text-base leading-tight">
              {enrich?.building_name || listing.address?.split(",")[0] || "Unnamed Building"}
            </h3>
            <p className="text-slate-300 text-sm mt-0.5">
              {listing.neighborhood}, {listing.borough}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-400">
              ${listing.price_monthly?.toLocaleString()}
            </p>
            <p className="text-slate-400 text-xs">/month</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Quick stats */}
        <div className="flex gap-3 text-sm text-slate-600 flex-wrap">
          <span>Studio · 1 Bath</span>
          {listing.sq_ft && <span>{listing.sq_ft} sqft</span>}
          {listing.floor != null && listing.floor > 0 && <span>Floor {listing.floor}</span>}
          {listing.no_fee && (
            <span className="text-emerald-600 font-medium">No Fee</span>
          )}
        </div>

        {/* Transit */}
        {enrich?.subway_lines && enrich.subway_lines.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">🚇</span>
            <span className="text-slate-700">
              {enrich.subway_lines.map((l) => (
                <span
                  key={l}
                  className="inline-block bg-slate-800 text-white text-xs px-1.5 py-0.5 rounded font-mono mr-1"
                >
                  {l}
                </span>
              ))}
              {enrich.subway_walk_min && (
                <span className="text-slate-500 ml-1">{enrich.subway_walk_min} min walk</span>
              )}
            </span>
            {enrich.commute_midtown_min && (
              <span className="text-slate-400 text-xs ml-auto">
                ~{enrich.commute_midtown_min} min to Midtown
              </span>
            )}
          </div>
        )}

        {/* Amenity tags */}
        {listing.amenities && listing.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {listing.amenities.slice(0, 5).map((a) => (
              <span
                key={a}
                className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full border border-slate-200"
              >
                {a}
              </span>
            ))}
            {listing.amenities.length > 5 && (
              <span className="text-slate-400 text-xs self-center">
                +{listing.amenities.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Laundry + Pets */}
        <div className="flex gap-4 text-xs text-slate-500">
          <span>{laundryLabel[listing.laundry || "unknown"] || "Laundry unknown"}</span>
          {listing.pet_policy && listing.pet_policy !== "unknown" && (
            <span className={listing.pet_policy === "no_pets" ? "text-red-400" : "text-emerald-600"}>
              {listing.pet_policy === "pets_allowed" || listing.pet_policy === "dogs_ok"
                ? "Pet friendly"
                : listing.pet_policy === "no_pets"
                ? "No pets"
                : listing.pet_policy}
            </span>
          )}
        </div>

        {/* Review signal */}
        {review?.overall_signal && (
          <div
            className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center justify-between ${
              SIGNAL_COLORS[review.overall_signal] || "text-slate-600 bg-slate-50 border-slate-200"
            }`}
          >
            <span>Review signal: {SIGNAL_LABELS[review.overall_signal] || review.overall_signal}</span>
            {review.google_rating && (
              <span className="font-semibold">⭐ {review.google_rating}</span>
            )}
          </div>
        )}

        {/* Fit score badge */}
        {fitScore != null && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-slate-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  fitScore >= 80 ? "bg-emerald-500" : fitScore >= 65 ? "bg-blue-500" : "bg-yellow-500"
                }`}
                style={{ width: `${fitScore}%` }}
              />
            </div>
            <span className="text-sm font-bold text-slate-700 w-14 text-right">
              {fitScore}/100
            </span>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-5 pb-4 flex gap-2 border-t border-slate-100 pt-3">
        <Link
          href={`/listings/${listing.listing_id}`}
          className="flex-1 text-center bg-slate-900 text-white text-sm py-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          View Details
        </Link>
        {review && (
          <Link
            href={`/research/${listing.listing_id}`}
            className="px-3 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors"
            title="Review Research"
          >
            📋
          </Link>
        )}
        {showSelectButton && (
          <button
            onClick={() => onSelect?.(listing.listing_id)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors border ${
              selected
                ? "bg-emerald-500 text-white border-emerald-500"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title={selected ? "Remove from comparison" : "Add to comparison"}
          >
            {selected ? "✓" : "+"}
          </button>
        )}
      </div>
    </div>
  );
}
