"use client";

import { useEffect, useState, useMemo } from "react";
import { getListings, Listing } from "@/lib/api";
import ListingCard from "@/components/ListingCard";
import LicMiniMap from "@/components/LicMiniMap";
import Link from "next/link";

type SortKey = "price_monthly" | "commute" | "fit_score" | "risk";

export default function ListingsPage() {
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [maxRent, setMaxRent] = useState("");
  const [noFee, setNoFee] = useState(false);
  const [doorman, setDoorman] = useState(false);
  const [elevator, setElevator] = useState(false);
  const [laundry, setLaundry] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("price_monthly");

  useEffect(() => {
    setLoading(true);
    getListings()
      .then((d) => setAllListings(d.listings))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...allListings];
    if (maxRent) list = list.filter((l) => l.price_monthly <= parseInt(maxRent));
    if (noFee) list = list.filter((l) => l.no_fee);
    if (doorman) list = list.filter((l) => l.doorman);
    if (elevator) list = list.filter((l) => l.elevator);
    if (laundry) list = list.filter((l) => l.laundry === laundry);
    list.sort((a, b) => {
      if (sortKey === "price_monthly") return (a.price_monthly || 0) - (b.price_monthly || 0);
      if (sortKey === "commute") return (a._enrichment?.commute_midtown_min ?? 99) - (b._enrichment?.commute_midtown_min ?? 99);
      if (sortKey === "fit_score") return (b._fit_score ?? 0) - (a._fit_score ?? 0);
      if (sortKey === "risk") return (a._review_summary?.risk_flags?.length ?? 0) - (b._review_summary?.risk_flags?.length ?? 0);
      return 0;
    });
    return list;
  }, [allListings, maxRent, noFee, doorman, elevator, laundry, sortKey]);

  const prices = allListings.map((l) => l.price_monthly).filter(Boolean);
  const commutes = allListings.map((l) => l._enrichment?.commute_midtown_min).filter(Boolean) as number[];
  const reviewedCount = allListings.filter((l) => l._review_summary).length;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else if (next.size < 3) next.add(id);
      return next;
    });
  }

  function clearFilters() { setMaxRent(""); setNoFee(false); setDoorman(false); setElevator(false); setLaundry(""); }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Listings Database</h1>
          <p className="text-slate-500 text-sm mt-0.5">LIC Studio Demo · {loading ? "..." : `${filtered.length} of ${allListings.length} listings`}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/query" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors">🔍 NL Search</Link>
          {selected.size >= 2 && (
            <Link href={`/compare?ids=${Array.from(selected).join(",")}`} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 transition-colors">
              Compare {selected.size} →
            </Link>
          )}
        </div>
      </div>

      {/* Stats strip */}
      {!loading && allListings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { value: allListings.length, label: "Total Listings" },
            { value: prices.length ? `$${Math.min(...prices).toLocaleString()}–$${Math.max(...prices).toLocaleString()}` : "N/A", label: "Rent Range" },
            { value: commutes.length ? `${Math.min(...commutes)}–${Math.max(...commutes)} min` : "N/A", label: "Midtown Commute" },
            { value: reviewedCount, label: "Buildings Reviewed" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {selected.size > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-5 flex items-center justify-between text-sm text-emerald-700">
          <span>{selected.size} selected{selected.size < 2 && " — add at least 2 to compare"}</span>
          {selected.size >= 2 && <Link href={`/compare?ids=${Array.from(selected).join(",")}`} className="font-semibold hover:underline">Compare now →</Link>}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0 hidden md:block space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Filters</p>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Max Rent</label>
              <input type="number" value={maxRent} onChange={(e) => setMaxRent(e.target.value)} placeholder="e.g. 3000"
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Laundry</label>
              <select value={laundry} onChange={(e) => setLaundry(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                <option value="">Any</option>
                <option value="in_unit">In-unit</option>
                <option value="in_building">In-building</option>
              </select>
            </div>
            {[{ key: "noFee", label: "No Fee", value: noFee, set: setNoFee },
              { key: "doorman", label: "Doorman", value: doorman, set: setDoorman },
              { key: "elevator", label: "Elevator", value: elevator, set: setElevator }
            ].map(({ key, label, value, set }) => (
              <label key={key} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={value} onChange={(e) => set(e.target.checked)} className="accent-emerald-600" />{label}
              </label>
            ))}
            <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-slate-600 w-full text-left">Clear all</button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Sort By</p>
            {[
              { key: "price_monthly" as SortKey, label: "Price (low→high)" },
              { key: "commute" as SortKey, label: "Commute (fastest)" },
              { key: "fit_score" as SortKey, label: "Fit Score" },
              { key: "risk" as SortKey, label: "Lowest Risk" },
            ].map((s) => (
              <button key={s.key} onClick={() => setSortKey(s.key)}
                className={`block w-full text-left text-xs py-1.5 px-2 rounded transition-colors ${sortKey === s.key ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-slate-600 hover:bg-slate-50"}`}>
                {sortKey === s.key && "✓ "}{s.label}
              </button>
            ))}
          </div>

          {!loading && allListings.length > 0 && (
            <LicMiniMap listings={allListings} highlightedId={hoveredId || undefined} onHover={setHoveredId} />
          )}
        </aside>

        {/* Main grid */}
        <div className="flex-1 min-w-0">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5 text-red-700 text-sm">{error} — Make sure the API is running on port 8000.</div>}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-slate-100 rounded-xl h-72 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((listing) => (
                <ListingCard key={listing.listing_id} listing={listing}
                  selected={selected.has(listing.listing_id)} onSelect={toggleSelect}
                  showSelectButton highlight={hoveredId === listing.listing_id} />
              ))}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              No listings found. <button onClick={clearFilters} className="text-emerald-600 hover:underline">Clear filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
