"use client";

import ScoreRing from "@/components/ScoreRing";

interface FitResult {
  fit_score: number;
  fit_label: string;
  why_it_matches: string[];
  tradeoffs: string[];
  verdict: string;
  score_breakdown: Record<string, number>;
  listing_id?: string;
  listing_name?: string;
}

interface Props {
  result: FitResult | null;
  isLoading?: boolean;
}

const BREAKDOWN_LABELS: Record<string, string> = {
  price: "Price / Value",
  commute: "Commute",
  building_quality: "Building Quality",
  amenities: "Amenities",
  must_haves: "Must-haves",
  avoid_penalty: "Avoid Penalty",
};

export default function FitTab({ result, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="p-5 space-y-3">
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-8">
        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mb-3">
          <span className="text-base text-gray-400">F</span>
        </div>
        <p className="text-gray-500 text-sm font-medium mb-1">No fit analysis</p>
        <p className="text-gray-400 text-xs">Click "Fit" on a listing row or ask the agent to analyze.</p>
      </div>
    );
  }

  const scoreColor =
    result.fit_score >= 80 ? "text-emerald-600" :
    result.fit_score >= 65 ? "text-blue-600" :
    "text-amber-600";

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      {/* Score hero */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 flex items-center gap-6">
        <ScoreRing score={result.fit_score} size={76} strokeWidth={7} />
        <div>
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Fit Score</p>
          <p className={`text-4xl font-bold ${scoreColor}`}>
            {result.fit_score}<span className="text-lg font-normal text-gray-400">/100</span>
          </p>
          <p className="text-gray-700 font-medium mt-1">{result.fit_label}</p>
          {result.listing_name && (
            <p className="text-gray-400 text-xs mt-0.5">{result.listing_name}</p>
          )}
        </div>
      </div>

      {/* Score breakdown */}
      {Object.keys(result.score_breakdown).length > 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Score Breakdown</p>
          <div className="space-y-2">
            {Object.entries(result.score_breakdown).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-32 flex-shrink-0">{BREAKDOWN_LABELS[key] || key}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      val >= 80 ? "bg-emerald-500" : val >= 60 ? "bg-blue-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${Math.min(val, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-7 text-right font-medium">{Math.round(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Why it matches */}
      {result.why_it_matches.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2.5">Why It Matches</p>
          <ul className="space-y-2">
            {result.why_it_matches.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 flex-shrink-0 mt-0.5">✓</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tradeoffs */}
      {result.tradeoffs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2.5">Tradeoffs</p>
          <ul className="space-y-2">
            {result.tradeoffs.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-amber-600 flex-shrink-0 mt-0.5">△</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Verdict */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Verdict</p>
        <p className="text-sm text-gray-700 leading-relaxed">{result.verdict}</p>
      </div>
    </div>
  );
}
