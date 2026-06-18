"use client";

interface CompareResult {
  summary: string;
  verdicts: Record<string, string>;
  verdict_explanations: Record<string, string>;
  comparison_rows: { category: string; values: Record<string, string>; winner?: string }[];
  bottom_line: string;
  listings: Record<string, unknown>[];
}

interface Props {
  result: CompareResult | null;
  isLoading?: boolean;
}

const VERDICT_ICONS: Record<string, string> = {
  best_overall: "🏆",
  best_value: "💰",
  lowest_risk: "🛡️",
  best_commute: "🚇",
  best_amenities: "✨",
};

const VERDICT_LABELS: Record<string, string> = {
  best_overall: "Best Overall",
  best_value: "Best Value",
  lowest_risk: "Lowest Risk",
  best_commute: "Best Commute",
  best_amenities: "Best Amenities",
};

export default function CompareTab({ result, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-24 bg-slate-800/60 rounded-xl animate-pulse" />
        <div className="h-48 bg-slate-800/60 rounded-xl animate-pulse" />
        <div className="h-24 bg-slate-800/60 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-8">
        <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center mb-4">
          <span className="text-2xl">⚖️</span>
        </div>
        <p className="text-slate-400 text-sm font-medium mb-2">暂无对比分析</p>
        <p className="text-slate-600 text-xs">在 Listings tab 中选择 2-3 个房源，在 Agent Console 输入"对比分析"</p>
      </div>
    );
  }

  const listingIds = result.listings.map((l) => (l as Record<string, unknown>).listing_id as string);

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      {/* Summary */}
      <div className="bg-slate-800/60 rounded-xl border border-white/10 p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Comparison Summary</p>
        <p className="text-sm text-slate-200 leading-relaxed">{result.summary}</p>
      </div>

      {/* Verdict cards */}
      {Object.keys(result.verdicts).length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(result.verdicts).map(([key, value]) => (
            <div key={key} className="bg-slate-800/60 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base">{VERDICT_ICONS[key] || "•"}</span>
                <p className="text-xs text-slate-500 font-medium">{VERDICT_LABELS[key] || key}</p>
              </div>
              <p className="text-sm text-white font-semibold truncate">{value}</p>
              {result.verdict_explanations?.[key] && (
                <p className="text-xs text-slate-500 mt-1 leading-snug line-clamp-2">
                  {result.verdict_explanations[key]}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Comparison table */}
      {result.comparison_rows.length > 0 && (
        <div className="bg-slate-800/60 rounded-xl border border-white/10 overflow-hidden">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 border-b border-white/5">
            Side-by-Side Comparison
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-slate-500 px-4 py-2.5 font-medium w-28">Category</th>
                  {listingIds.map((id, i) => (
                    <th key={id} className="text-left text-slate-400 px-4 py-2.5 font-medium">
                      Option {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {result.comparison_rows.map((row) => (
                  <tr key={row.category} className="hover:bg-white/2 transition-colors">
                    <td className="text-slate-500 px-4 py-2.5 font-medium">{row.category}</td>
                    {listingIds.map((id) => (
                      <td
                        key={id}
                        className={`px-4 py-2.5 ${
                          row.winner === id ? "text-emerald-300 font-medium" : "text-slate-300"
                        }`}
                      >
                        {row.values[id] || "—"}
                        {row.winner === id && (
                          <span className="ml-1 text-emerald-500 text-xs">✓</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom line */}
      <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4">
        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Bottom Line</p>
        <p className="text-sm text-slate-200 leading-relaxed">{result.bottom_line}</p>
      </div>
    </div>
  );
}
