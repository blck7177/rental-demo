"use client";

import { useEffect, useState } from "react";
import { getListings, Listing } from "@/lib/api";
import ListingCard from "@/components/ListingCard";
import Link from "next/link";

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Filters
  const [maxRent, setMaxRent] = useState("");
  const [noFee, setNoFee] = useState(false);
  const [doorman, setDoorman] = useState(false);
  const [elevator, setElevator] = useState(false);

  async function fetchListings() {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number | boolean> = {};
      if (maxRent) params.max_rent = parseInt(maxRent);
      if (noFee) params.no_fee = true;
      if (doorman) params.doorman = true;
      if (elevator) params.elevator = true;
      const data = await getListings(params);
      setListings(data.listings);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchListings();
  }, []);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Listings Database</h1>
          <p className="text-slate-500 text-sm mt-1">
            {loading ? "Loading..." : `${listings.length} listings · LIC Studio Demo`}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/query"
            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors"
          >
            🔍 Natural Language Search
          </Link>
          {selected.size >= 2 && (
            <Link
              href={`/compare?ids=${Array.from(selected).join(",")}`}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 transition-colors"
            >
              Compare {selected.size} →
            </Link>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-8 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Max Rent</label>
          <input
            type="number"
            value={maxRent}
            onChange={(e) => setMaxRent(e.target.value)}
            placeholder="e.g. 3200"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" checked={noFee} onChange={(e) => setNoFee(e.target.checked)} className="accent-emerald-600" />
          No Fee
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" checked={doorman} onChange={(e) => setDoorman(e.target.checked)} className="accent-emerald-600" />
          Doorman
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" checked={elevator} onChange={(e) => setElevator(e.target.checked)} className="accent-emerald-600" />
          Elevator
        </label>
        <button
          onClick={fetchListings}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors"
        >
          Apply Filters
        </button>
        <button
          onClick={() => { setMaxRent(""); setNoFee(false); setDoorman(false); setElevator(false); setTimeout(fetchListings, 0); }}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Clear
        </button>
      </div>

      {/* Compare hint */}
      {selected.size > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-6 text-sm text-emerald-700 flex items-center justify-between">
          <span>
            {selected.size} listing{selected.size > 1 ? "s" : ""} selected for comparison
            {selected.size < 2 && " — select at least 2"}
          </span>
          {selected.size >= 2 && (
            <Link href={`/compare?ids=${Array.from(selected).join(",")}`} className="font-semibold hover:underline">
              Compare now →
            </Link>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">
          {error} — Make sure the API is running on port 8000.
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-slate-100 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <ListingCard
              key={listing.listing_id}
              listing={listing}
              selected={selected.has(listing.listing_id)}
              onSelect={toggleSelect}
              showSelectButton
            />
          ))}
        </div>
      )}

      {!loading && listings.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          No listings found with current filters.
        </div>
      )}
    </div>
  );
}
