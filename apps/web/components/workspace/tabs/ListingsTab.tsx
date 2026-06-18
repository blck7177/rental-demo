"use client";

import { Listing } from "@/lib/api";

interface Props {
  listings: Listing[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onAnalyze: (id: string) => void;
  onResearch: (id: string) => void;
  isLoading?: boolean;
  parsedSummary?: string;
}

function getDisplayName(listing: Listing): string {
  return listing._enrichment?.building_name ?? listing.address?.split(",")[0] ?? "—";
}

function getSignalStyle(signal?: string): string {
  if (!signal) return "text-gray-400";
  if (signal.includes("strong") || signal.includes("Strong")) return "text-emerald-600";
  if (signal.includes("good") || signal.includes("Good")) return "text-blue-600";
  return "text-amber-600";
}

export default function ListingsTab({ listings, selectedIds, onSelect, onAnalyze, onResearch, isLoading, parsedSummary }: Props) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-8">
        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mb-3">
          <span className="text-base text-gray-400">H</span>
        </div>
        <p className="text-gray-500 text-sm font-medium mb-1">No listings loaded</p>
        <p className="text-gray-400 text-xs">
          Ask the agent to search, e.g.:<br />
          "Find LIC studios for Emily, budget $3,200"
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {parsedSummary && (
        <div className="flex-shrink-0 mx-4 mt-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <p className="text-blue-700 text-xs leading-relaxed">{parsedSummary}</p>
        </div>
      )}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5">
        <p className="text-xs text-gray-400">
          {listings.length} results · {selectedIds.size > 0 ? `${selectedIds.size} selected` : "click row to select"}
        </p>
        {selectedIds.size >= 2 && (
          <span className="text-xs text-blue-600 font-medium">
            {selectedIds.size} selected — ask agent to compare
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-gray-400 font-medium px-4 py-2 w-5">#</th>
              <th className="text-left text-gray-400 font-medium px-4 py-2">Building</th>
              <th className="text-left text-gray-400 font-medium px-4 py-2">Rent</th>
              <th className="text-left text-gray-400 font-medium px-4 py-2 hidden md:table-cell">Commute</th>
              <th className="text-left text-gray-400 font-medium px-4 py-2 hidden lg:table-cell">Signal</th>
              <th className="text-right text-gray-400 font-medium px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {listings.map((listing, idx) => {
              const isSelected = selectedIds.has(listing.listing_id);
              const commute = listing._enrichment?.commute_midtown_min;
              const signal = listing._review_summary?.overall_signal?.replace(/_/g, " ");
              return (
                <tr
                  key={listing.listing_id}
                  onClick={() => onSelect(listing.listing_id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold ${
                      idx === 0 ? "bg-emerald-500" : idx === 1 ? "bg-blue-500" : idx === 2 ? "bg-gray-400" : "bg-gray-200 text-gray-500"
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className={`font-medium ${isSelected ? "text-blue-700" : "text-gray-800"}`}>
                      {getDisplayName(listing)}
                    </p>
                    <p className="text-gray-400 mt-0.5">
                      {listing.neighborhood ?? listing.borough ?? "—"}
                      {listing.no_fee && <span className="ml-1.5 text-emerald-600">No fee</span>}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gray-800">
                    ${listing.price_monthly.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 hidden md:table-cell">
                    {commute ? `${commute} min` : "—"}
                  </td>
                  <td className="px-4 py-2.5 hidden lg:table-cell">
                    {signal ? (
                      <span className={`text-xs font-medium capitalize ${getSignalStyle(signal)}`}>
                        {signal}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onAnalyze(listing.listing_id)}
                        className="text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                      >
                        Fit
                      </button>
                      <button
                        onClick={() => onResearch(listing.listing_id)}
                        className="text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                      >
                        Research
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
