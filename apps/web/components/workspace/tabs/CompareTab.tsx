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

const VERDICT_LABELS: Record<string, string> = {
  best_overall:   "Best Overall",
  best_value:     "Best Value",
  lowest_risk:    "Lowest Risk",
  best_commute:   "Best Commute",
  best_amenities: "Best Amenities",
};

export default function CompareTab({ result, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="p-5 space-y-3">
        <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-8">
        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mb-3">
          <span className="text-base text-gray-400">≈</span>
        </div>
        <p className="text-gray-500 text-sm font-medium mb-1">No comparison yet</p>
        <p className="text-gray-400 text-xs">Select 2–3 listings, then ask the agent to compare.</p>
      </div>
    );
  }

  const listingIds = result.listings.map((l) => (l as Record<string, unknown>).listing_id as string);

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      {/* Summary */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Summary</p>
        <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>
      </div>

      {/* Verdict cards */}
      {Object.keys(result.verdicts).length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(result.verdicts).map(([key, value]) => (
            <div key={key} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-medium mb-1">{VERDICT_LABELS[key] || key}</p>
              <p className="text-sm text-gray-800 font-semibold truncate">{value}</p>
              {result.verdict_explanations?.[key] && (
                <p className="text-xs text-gray-500 mt-1 leading-snug line-clamp-2">
                  {result.verdict_explanations[key]}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Comparison table */}
      {result.comparison_rows.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 border-b border-gray-100">
            Side-by-Side
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-gray-400 px-4 py-2.5 font-medium w-28">Criteria</th>
                  {listingIds.map((id, i) => (
                    <th key={id} className="text-left text-gray-500 px-4 py-2.5 font-medium">
                      Option {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {result.comparison_rows.map((row) => (
                  <tr key={row.category} className="hover:bg-gray-50 transition-colors">
                    <td className="text-gray-500 px-4 py-2.5 font-medium">{row.category}</td>
                    {listingIds.map((id) => (
                      <td
                        key={id}
                        className={`px-4 py-2.5 ${
                          row.winner === id ? "text-emerald-700 font-semibold" : "text-gray-600"
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
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">Recommendation</p>
        <p className="text-sm text-gray-700 leading-relaxed">{result.bottom_line}</p>
      </div>
    </div>
  );
}
