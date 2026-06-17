"use client";

const SOURCE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  google_places: { bg: "bg-blue-100", text: "text-blue-700", label: "Google" },
  streeteasy_reviews: { bg: "bg-orange-100", text: "text-orange-700", label: "StreetEasy" },
  "streeteasy.com": { bg: "bg-orange-100", text: "text-orange-700", label: "StreetEasy" },
  renthop_reviews: { bg: "bg-purple-100", text: "text-purple-700", label: "RentHop" },
  "renthop.com": { bg: "bg-purple-100", text: "text-purple-700", label: "RentHop" },
  "apartments.com": { bg: "bg-green-100", text: "text-green-700", label: "Apartments.com" },
  yelp: { bg: "bg-red-100", text: "text-red-700", label: "Yelp" },
  reddit: { bg: "bg-amber-100", text: "text-amber-700", label: "Reddit" },
};

export default function SourceBadge({ source }: { source: string }) {
  const style = SOURCE_STYLES[source] || { bg: "bg-slate-100", text: "text-slate-600", label: source };
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}
