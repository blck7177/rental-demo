"use client";
import { useState } from "react";
import { Listing } from "@/lib/api";

function getNodeForListing(listing: Listing): { x: number; y: number } {
  const n = (listing.neighborhood || "").toLowerCase();
  if (n.includes("queensboro")) return { x: 210, y: 40 };
  if (n.includes("hunters")) return { x: 100, y: 135 };
  if (n.includes("dutch")) return { x: 230, y: 90 };
  if (n.includes("sunnyside")) return { x: 260, y: 60 };
  const seed = listing.listing_id.charCodeAt(listing.listing_id.length - 1);
  return { x: 145 + ((seed % 30) - 15), y: 70 + ((seed % 20) - 10) };
}

interface Props {
  listings: Listing[];
  highlightedId?: string;
  onHover?: (id: string | null) => void;
}

export default function LicMiniMap({ listings, highlightedId, onHover }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="bg-slate-800 rounded-xl border border-white/10 p-3">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">LIC Area Map</p>
      <svg viewBox="0 0 300 200" className="w-full h-auto">
        <rect width="300" height="200" fill="#1e293b" rx="8" />
        <rect x="0" y="140" width="80" height="60" fill="#1e3a5f" opacity="0.5" rx="4" />
        <text x="20" y="175" fill="#60a5fa" fontSize="8" opacity="0.7">East River</text>
        <rect x="0" y="0" width="55" height="140" fill="#334155" opacity="0.4" rx="4" />
        <text x="5" y="70" fill="#94a3b8" fontSize="8" opacity="0.7" transform="rotate(-90,28,70)">Manhattan</text>
        <line x1="145" y1="20" x2="145" y2="180" stroke="#f59e0b" strokeWidth="1" opacity="0.3" strokeDasharray="4,3" />
        <text x="148" y="30" fill="#f59e0b" fontSize="7" opacity="0.5">7</text>
        {listings.map((listing) => {
          const pos = getNodeForListing(listing);
          const isHl = highlightedId === listing.listing_id || hovered === listing.listing_id;
          const color = listing.price_monthly <= 2600 ? "#10b981" : listing.price_monthly <= 3000 ? "#3b82f6" : "#f59e0b";
          return (
            <g key={listing.listing_id}>
              {isHl && <circle cx={pos.x} cy={pos.y} r="12" fill={color} opacity="0.15" />}
              <circle cx={pos.x} cy={pos.y} r={isHl ? 7 : 5} fill={color} opacity={isHl ? 1 : 0.7}
                className="cursor-pointer"
                onMouseEnter={() => { setHovered(listing.listing_id); onHover?.(listing.listing_id); }}
                onMouseLeave={() => { setHovered(null); onHover?.(null); }}
              />
              {isHl && (
                <text x={pos.x} y={pos.y - 10} fill="white" fontSize="8" textAnchor="middle" fontWeight="bold">
                  ${listing.price_monthly.toLocaleString()}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex gap-3 mt-2 justify-center">
        {[{ color: "bg-emerald-500", label: "≤$2,600" }, { color: "bg-blue-500", label: "≤$3,000" }, { color: "bg-amber-500", label: ">$3,000" }].map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${l.color}`} />
            <span className="text-xs text-slate-500">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
