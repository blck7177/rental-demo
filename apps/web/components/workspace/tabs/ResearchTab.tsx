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
  mostly_positive: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  mixed: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  mostly_negative: "bg-red-500/10 text-red-300 border-red-500/20",
  positive: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  negative: "bg-red-500/10 text-red-300 border-red-500/20",
};

export default function ResearchTab({ result, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-24 bg-slate-800/60 rounded-xl animate-pulse" />
        <div className="h-32 bg-slate-800/60 rounded-xl animate-pulse" />
        <div className="h-24 bg-slate-800/60 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-8">
        <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center mb-4">
          <span className="text-2xl">📋</span>
        </div>
        <p className="text-slate-400 text-sm font-medium mb-2">暂无楼宇研究</p>
        <p className="text-slate-600 text-xs">在 Listings tab 中悬停房源卡片，点击「Research」</p>
      </div>
    );
  }

  const signalClass = SIGNAL_STYLES[result.overall_signal] ?? SIGNAL_STYLES["mixed"];

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="bg-slate-800/60 rounded-xl border border-white/10 p-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide">Building Research</p>
          <h3 className="text-white font-semibold text-lg leading-tight">{result.building_name}</h3>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={`text-xs px-3 py-1 rounded-full border font-medium capitalize ${signalClass}`}>
            {result.overall_signal.replace(/_/g, " ")}
          </span>
          {result.rating_snapshot?.google_rating && (
            <span className="text-sm text-slate-400">
              ⭐ {result.rating_snapshot.google_rating}
              {result.rating_snapshot.review_count && (
                <span className="text-slate-600 text-xs ml-1">({result.rating_snapshot.review_count} reviews)</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Risk flags */}
      {result.risk_flags.length > 0 && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Risk Flags</p>
          <div className="space-y-3">
            {result.risk_flags.map((flag, i) => (
              <div key={i} className="flex items-start gap-3">
                <RiskBadge severity={flag.severity} type={flag.type} />
                <p className="text-xs text-slate-400 leading-relaxed flex-1">{flag.evidence}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positive themes */}
      {result.positive_themes.length > 0 && (
        <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2.5">Positive Themes</p>
          <ul className="space-y-1.5">
            {result.positive_themes.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-emerald-500 flex-shrink-0 mt-0.5">+</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Negative themes */}
      {result.negative_themes.length > 0 && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2.5">Concerns</p>
          <ul className="space-y-1.5">
            {result.negative_themes.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-red-400 flex-shrink-0 mt-0.5">−</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Research notes */}
      {result.research_notes && (
        <div className="bg-slate-800/60 border border-white/10 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Research Notes</p>
          <p className="text-sm text-slate-300 leading-relaxed">{result.research_notes}</p>
        </div>
      )}

      {/* Neighborhood notes */}
      {result.neighborhood_notes && (
        <div className="bg-slate-800/60 border border-white/10 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Neighborhood Notes</p>
          <p className="text-sm text-slate-300 leading-relaxed">{result.neighborhood_notes}</p>
        </div>
      )}
    </div>
  );
}
