"use client";

const SOURCE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  google_places:        { bg: "bg-blue-500/15 border border-blue-500/25",   text: "text-blue-300",   label: "Google" },
  streeteasy_reviews:   { bg: "bg-orange-500/15 border border-orange-500/25", text: "text-orange-300", label: "StreetEasy" },
  "streeteasy.com":     { bg: "bg-orange-500/15 border border-orange-500/25", text: "text-orange-300", label: "StreetEasy" },
  renthop_reviews:      { bg: "bg-purple-500/15 border border-purple-500/25", text: "text-purple-300", label: "RentHop" },
  "renthop.com":        { bg: "bg-purple-500/15 border border-purple-500/25", text: "text-purple-300", label: "RentHop" },
  "apartments.com":     { bg: "bg-green-500/15 border border-green-500/25",  text: "text-green-300",  label: "Apartments.com" },
  yelp:                 { bg: "bg-red-500/15 border border-red-500/25",      text: "text-red-300",    label: "Yelp" },
  reddit:               { bg: "bg-amber-500/15 border border-amber-500/25",  text: "text-amber-300",  label: "Reddit" },
};

export default function SourceBadge({ source }: { source: string }) {
  const style = SOURCE_STYLES[source] || { bg: "bg-white/10 border border-white/10", text: "text-slate-400", label: source };
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}
