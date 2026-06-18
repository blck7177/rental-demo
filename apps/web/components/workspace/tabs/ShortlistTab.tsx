"use client";

import { useState, useEffect } from "react";
import { Listing, getClientShortlist } from "@/lib/api";

interface ShortlistEntry {
  entry_id?: string;
  listing_id: string;
  status: string;
  feedback?: string;
  added_at?: string;
}

interface Props {
  clientId: string | null | undefined;
  listings: Listing[];
  onResearch: (id: string) => void;
  onSwitchToCompare: () => void;
  onToggleSelect: (id: string) => void;
  selectedIds: Set<string>;
  isLoading?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  saved:    "bg-gray-100 text-gray-600 border-gray-200",
  sent:     "bg-blue-50 text-blue-600 border-blue-200",
  liked:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
};

function getListingName(id: string, listings: Listing[]): string {
  const match = listings.find((l) => l.listing_id === id);
  return match?._enrichment?.building_name ?? match?.address?.split(",")[0] ?? id.slice(0, 12);
}

function getListingPrice(id: string, listings: Listing[]): string {
  const match = listings.find((l) => l.listing_id === id);
  return match?.price_monthly ? `$${match.price_monthly.toLocaleString()}` : "—";
}

function getListingArea(id: string, listings: Listing[]): string {
  const match = listings.find((l) => l.listing_id === id);
  return match?.neighborhood ?? match?.borough ?? "—";
}

export default function ShortlistTab({
  clientId, listings, onResearch, onSwitchToCompare, onToggleSelect, selectedIds, isLoading,
}: Props) {
  const [entries, setEntries] = useState<ShortlistEntry[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;
    setFetching(true);
    setError(null);
    getClientShortlist(clientId)
      .then((data) => {
        const d = data as { shortlist?: ShortlistEntry[]; count?: number };
        setEntries(d.shortlist ?? []);
      })
      .catch(() => setError("Failed to load shortlist"))
      .finally(() => setFetching(false));
  }, [clientId]);

  if (isLoading || fetching) {
    return (
      <div className="p-5 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 px-8 text-center">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-8">
        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mb-3">
          <span className="text-lg">★</span>
        </div>
        <p className="text-gray-500 text-sm font-medium mb-1">Shortlist is empty</p>
        <p className="text-gray-400 text-xs">
          Add listings from the Listings tab or ask the agent to shortlist options.
        </p>
      </div>
    );
  }

  const selectedInShortlist = entries.filter((e) => selectedIds.has(e.listing_id));

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <p className="text-xs text-gray-500">
          {entries.length} saved · {selectedInShortlist.length > 0 ? `${selectedInShortlist.length} selected` : "click row to select"}
        </p>
        {selectedInShortlist.length >= 2 && (
          <button
            onClick={onSwitchToCompare}
            className="text-xs bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 px-3 py-1 rounded-lg transition-colors font-medium"
          >
            Compare selected
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-gray-400 font-medium px-4 py-2 w-5">#</th>
              <th className="text-left text-gray-400 font-medium px-4 py-2">Building</th>
              <th className="text-left text-gray-400 font-medium px-4 py-2">Rent</th>
              <th className="text-left text-gray-400 font-medium px-4 py-2 hidden sm:table-cell">Area</th>
              <th className="text-left text-gray-400 font-medium px-4 py-2">Status</th>
              <th className="text-right text-gray-400 font-medium px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map((entry, idx) => {
              const isSelected = selectedIds.has(entry.listing_id);
              return (
                <tr
                  key={entry.listing_id}
                  onClick={() => onToggleSelect(entry.listing_id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-2.5 text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-2.5">
                    <span className={`font-medium ${isSelected ? "text-blue-700" : "text-gray-800"}`}>
                      {getListingName(entry.listing_id, listings)}
                    </span>
                    {entry.feedback && (
                      <p className="text-gray-400 text-xs mt-0.5 truncate max-w-[140px]">{entry.feedback}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-700 font-medium">
                    {getListingPrice(entry.listing_id, listings)}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 hidden sm:table-cell">
                    {getListingArea(entry.listing_id, listings)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full border text-xs font-medium capitalize ${STATUS_STYLES[entry.status] ?? STATUS_STYLES["saved"]}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onResearch(entry.listing_id)}
                      className="text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                    >
                      Research
                    </button>
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
