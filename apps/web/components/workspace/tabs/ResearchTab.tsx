"use client";

import RiskBadge from "@/components/RiskBadge";

interface ResearchResult {
  building_name: string;
  overall_signal: string;
  rating_snapshot: { google_rating?: number; review_count?: number };
  positive_themes: string[];
  negative_themes: string[];
  risk_flags: { type: string; severity: string; evidence: string }[];
  research_notes: string;
  neighborhood_notes?: string;
}

interface Props {
  result: ResearchResult | null;
  isLoading?: boolean;
}

const SIGNAL_STYLES: Record<string, string> = {
  mostly_positive: "bg-emerald-50 text-emerald-700 border-emerald-200",
  positive:        "bg-emerald-50 text-emerald-700 border-emerald-200",
  mixed:           "bg-amber-50 text-amber-700 border-amber-200",
  mostly_negative: "bg-red-50 text-red-600 border-red-200",
  negative:        "bg-red-50 text-red-600 border-red-200",
};

export default function ResearchTab({ result, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="p-5 space-y-3">
        <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-8">
        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mb-3">
          <span className="text-base text-gray-400">R</span>
        </div>
        <p className="text-gray-500 text-sm font-medium mb-1">No building research</p>
        <p className="text-gray-400 text-xs">Click "Research" on a listing or ask the agent to investigate a building.</p>
      </div>
    );
  }

  const signalClass = SIGNAL_STYLES[result.overall_signal] ?? SIGNAL_STYLES["mixed"];

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Building Research</p>
          <h3 className="text-gray-900 font-semibold text-base leading-tight">{result.building_name}</h3>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={`text-xs px-3 py-1 rounded-full border font-medium capitalize ${signalClass}`}>
            {result.overall_signal.replace(/_/g, " ")}
          </span>
          {result.rating_snapshot?.google_rating && (
            <span className="text-xs text-gray-500">
              {result.rating_snapshot.google_rating} ★
              {result.rating_snapshot.review_count && (
                <span className="text-gray-400 ml-1">({result.rating_snapshot.review_count})</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Risk flags */}
      {result.risk_flags.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-3">Risk Flags</p>
          <div className="space-y-3">
            {result.risk_flags.map((flag, i) => (
              <div key={i} className="flex items-start gap-3">
                <RiskBadge severity={flag.severity} type={flag.type} />
                <p className="text-xs text-gray-600 leading-relaxed flex-1">{flag.evidence}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positive themes */}
      {result.positive_themes.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2.5">Positives</p>
          <ul className="space-y-1.5">
            {result.positive_themes.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 flex-shrink-0 mt-0.5">+</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Negative themes */}
      {result.negative_themes.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2.5">Concerns</p>
          <ul className="space-y-1.5">
            {result.negative_themes.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-red-500 flex-shrink-0 mt-0.5">−</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Research notes */}
      {result.research_notes && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Research Notes</p>
          <p className="text-sm text-gray-600 leading-relaxed">{result.research_notes}</p>
        </div>
      )}

      {/* Neighborhood notes */}
      {result.neighborhood_notes && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Neighborhood</p>
          <p className="text-sm text-gray-600 leading-relaxed">{result.neighborhood_notes}</p>
        </div>
      )}
    </div>
  );
}
