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
      <div className="p-6 space-y-4">
        <div className="h-32 bg-slate-800/60 rounded-xl animate-pulse" />
        <div className="h-24 bg-slate-800/60 rounded-xl animate-pulse" />
        <div className="h-24 bg-slate-800/60 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-8">
        <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center mb-4">
          <span className="text-2xl">🎯</span>
        </div>
        <p className="text-slate-400 text-sm font-medium mb-2">暂无 Fit 分析</p>
        <p className="text-slate-600 text-xs">在 Listings tab 中悬停房源卡片，点击「Analyze」</p>
      </div>
    );
  }

  const scoreColor = result.fit_score >= 80 ? "text-emerald-400" : result.fit_score >= 65 ? "text-blue-400" : "text-amber-400";

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      {/* Score hero */}
      <div className="bg-slate-800/60 rounded-xl border border-white/10 p-5 flex items-center gap-6">
        <ScoreRing score={result.fit_score} size={80} strokeWidth={7} />
        <div>
          <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide">Fit Score</p>
          <p className={`text-4xl font-bold ${scoreColor}`}>{result.fit_score}<span className="text-lg font-normal text-slate-500">/100</span></p>
          <p className="text-white font-medium mt-1">{result.fit_label}</p>
          {result.listing_name && (
            <p className="text-slate-500 text-xs mt-0.5">{result.listing_name}</p>
          )}
        </div>
      </div>

      {/* Score breakdown */}
      {Object.keys(result.score_breakdown).length > 0 && (
        <div className="bg-slate-800/60 rounded-xl border border-white/10 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Score Breakdown</p>
          <div className="space-y-2">
            {Object.entries(result.score_breakdown).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-32 flex-shrink-0">{BREAKDOWN_LABELS[key] || key}</span>
                <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      val >= 80 ? "bg-emerald-500" : val >= 60 ? "bg-blue-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${Math.min(val, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-7 text-right font-medium">{Math.round(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Why it matches */}
      {result.why_it_matches.length > 0 && (
        <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2.5">Why It Matches</p>
          <ul className="space-y-2">
            {result.why_it_matches.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tradeoffs */}
      {result.tradeoffs.length > 0 && (
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2.5">Tradeoffs</p>
          <ul className="space-y-2">
            {result.tradeoffs.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-amber-500 flex-shrink-0 mt-0.5">△</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Verdict */}
      <div className="bg-slate-800/60 border border-white/10 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Verdict</p>
        <p className="text-sm text-slate-200 leading-relaxed">{result.verdict}</p>
      </div>
    </div>
  );
}
