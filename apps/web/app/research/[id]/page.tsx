"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getResearch, postResearch, ResearchResult } from "@/lib/api";

const SIGNAL_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  positive: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "Positive" },
  very_positive: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", label: "Very Positive" },
  mixed_positive: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", label: "Mixed Positive" },
  mixed: { bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-700", label: "Mixed" },
  mixed_negative: { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", label: "Mixed Negative" },
  negative: { bg: "bg-red-50 border-red-200", text: "text-red-700", label: "Negative" },
};

export default function ResearchPage() {
  const { id } = useParams<{ id: string }>();
  const [research, setResearch] = useState<ResearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getResearch(id);
        setResearch(data);
      } catch {
        // If not found, try to generate
        try {
          const data = await postResearch(id);
          setResearch(data);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Research failed");
        }
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  async function regenerate() {
    setLoading(true);
    setError(null);
    try {
      const data = await postResearch(id);
      setResearch(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Research failed");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-slate-100 rounded w-1/2" />
          <div className="h-32 bg-slate-100 rounded" />
          <div className="h-24 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="text-sm text-slate-500 mb-6">
        <Link href="/listings" className="hover:text-slate-700">← Listings</Link>
        {" / "}
        <Link href={`/listings/${id}`} className="hover:text-slate-700">Detail</Link>
        {" / Review Intelligence"}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">{error}</div>
      )}

      {research && (
        <>
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{research.building_name}</h1>
              <p className="text-slate-500 text-sm mt-1">Review Intelligence Report</p>
            </div>
            <button
              onClick={regenerate}
              className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg"
            >
              Regenerate
            </button>
          </div>

          {/* Overall signal */}
          {research.overall_signal && (
            <div className={`rounded-xl border p-5 mb-6 ${SIGNAL_STYLES[research.overall_signal]?.bg || "bg-slate-50 border-slate-200"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-60 mb-1">Overall Signal</p>
                  <p className={`text-2xl font-bold ${SIGNAL_STYLES[research.overall_signal]?.text || "text-slate-800"}`}>
                    {SIGNAL_STYLES[research.overall_signal]?.label || research.overall_signal}
                  </p>
                </div>
                {research.rating_snapshot?.google_rating && (
                  <div className="text-right">
                    <p className="text-3xl font-bold text-slate-800">
                      {research.rating_snapshot.google_rating}
                    </p>
                    <p className="text-slate-500 text-xs">
                      ⭐ Google · {research.rating_snapshot.review_count?.toLocaleString()} reviews
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Risk flags */}
          {research.risk_flags && research.risk_flags.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
              <h2 className="font-semibold text-slate-800 mb-3">⚠️ Risk Flags</h2>
              <div className="space-y-3">
                {research.risk_flags.map((flag, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border text-sm ${
                      flag.severity === "high"
                        ? "bg-red-50 border-red-200 text-red-800"
                        : flag.severity === "medium"
                        ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold capitalize">{flag.type}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        flag.severity === "high" ? "bg-red-200 text-red-700" :
                        flag.severity === "medium" ? "bg-yellow-200 text-yellow-700" :
                        "bg-slate-200 text-slate-600"
                      }`}>
                        {flag.severity}
                      </span>
                    </div>
                    <p className="text-sm opacity-80">{flag.evidence}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Positives & Negatives */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <h2 className="font-semibold text-emerald-800 mb-3">👍 Positive Themes</h2>
              <ul className="space-y-2">
                {research.positive_themes.map((t, i) => (
                  <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                    <span className="mt-0.5">✓</span> {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
              <h2 className="font-semibold text-orange-800 mb-3">👎 Negative Themes</h2>
              <ul className="space-y-2">
                {research.negative_themes.map((t, i) => (
                  <li key={i} className="text-sm text-orange-700 flex items-start gap-2">
                    <span className="mt-0.5">!</span> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Neighborhood notes */}
          {research.neighborhood_notes && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
              <h2 className="font-semibold text-slate-800 mb-2">📍 Neighborhood Notes</h2>
              <p className="text-slate-600 text-sm">{research.neighborhood_notes}</p>
            </div>
          )}

          {/* Research notes */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
            <h2 className="font-semibold text-slate-800 mb-2">📝 Research Summary</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{research.research_notes}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href={`/listings/${id}`}
              className="flex-1 text-center border border-slate-200 text-slate-700 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors"
            >
              ← Back to Listing
            </Link>
            <Link
              href={`/compare?ids=${id}`}
              className="flex-1 text-center bg-slate-900 text-white py-2.5 rounded-lg text-sm hover:bg-slate-700 transition-colors"
            >
              Add to Compare
            </Link>
          </div>
        </>
      )}

      {!research && !error && !loading && (
        <div className="text-center py-16 text-slate-500">
          <p className="mb-4">No review research available for this listing.</p>
          <button
            onClick={regenerate}
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-emerald-700 transition-colors"
          >
            Generate Research
          </button>
        </div>
      )}
    </div>
  );
}
