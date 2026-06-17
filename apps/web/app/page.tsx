"use client";

import { useState } from "react";
import { postIntake, UserProfile } from "@/lib/api";

const DEMO_NL =
  "I'm looking for a studio in Long Island City under $3,200. I care about commute to Midtown, in-unit laundry, quiet building, and avoiding bad management.";

const WEIGHT_LABELS: Record<string, string> = {
  price: "💰 Price / Value",
  commute: "🚇 Commute",
  building_quality: "🏢 Building Quality",
  amenities: "✨ Amenities",
};

export default function IntakePage() {
  const [nlText, setNlText] = useState(DEMO_NL);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await postIntake(nlText);
      setProfile(result.profile);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          NYC Rental Intelligence
        </h1>
        <p className="text-slate-500 text-lg">
          Describe your rental needs in plain English. AI will parse your requirements
          into an actionable search profile.
        </p>
      </div>

      {/* Workflow steps */}
      <div className="flex items-center justify-center gap-2 mb-10 text-xs text-slate-500">
        {["1. Intake", "2. Run Studio", "3. Listings", "4. NL Query", "5. Fit Analysis", "6. Compare", "7. Reviews", "8. Push"].map(
          (step, i) => (
            <span key={step} className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded ${i === 0 ? "bg-emerald-500 text-white font-semibold" : "bg-slate-100 text-slate-500"}`}>
                {step}
              </span>
              {i < 7 && <span className="text-slate-300">→</span>}
            </span>
          )
        )}
      </div>

      {/* Input card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Describe your requirements
        </label>
        <textarea
          value={nlText}
          onChange={(e) => setNlText(e.target.value)}
          rows={4}
          className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
          placeholder="e.g. Looking for a studio in LIC under $3,200 with good commute to Midtown..."
        />
        <div className="flex justify-between items-center mt-3">
          <button
            type="button"
            onClick={() => setNlText(DEMO_NL)}
            className="text-xs text-emerald-600 hover:underline"
          >
            Use demo example
          </button>
          <button
            type="submit"
            disabled={loading || !nlText.trim()}
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Parsing..." : "Parse Requirements →"}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Parsed profile */}
      {profile && (
        <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-6 animate-in fade-in">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-emerald-500 text-xl">✓</span>
            <h2 className="text-lg font-semibold text-slate-800">Search Profile Created</h2>
            <span className="ml-auto text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full">
              {profile.profile_id}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Budget */}
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Budget</p>
              <p className="text-xl font-bold text-slate-900">
                ≤ ${profile.budget_max?.toLocaleString()}
                <span className="text-sm font-normal text-slate-500">/mo</span>
              </p>
            </div>

            {/* Bedrooms */}
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Unit Type</p>
              <p className="text-xl font-bold text-slate-900">
                {profile.bedrooms === 0 ? "Studio" : `${profile.bedrooms}BR`}
              </p>
            </div>

            {/* Neighborhoods */}
            <div className="bg-slate-50 rounded-lg p-4 col-span-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Target Neighborhoods</p>
              <div className="flex flex-wrap gap-2">
                {profile.neighborhoods?.map((n) => (
                  <span key={n} className="bg-slate-800 text-white text-sm px-3 py-1 rounded-full">{n}</span>
                ))}
              </div>
            </div>

            {/* Must haves */}
            {profile.must_haves?.length > 0 && (
              <div className="bg-emerald-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Must Haves</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.must_haves.map((m) => (
                    <span key={m} className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Avoid */}
            {profile.avoid?.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">Avoid</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.avoid.map((a) => (
                    <span key={a} className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full border border-red-200">
                      ✗ {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Weights */}
            {profile.weights && (
              <div className="bg-slate-50 rounded-lg p-4 col-span-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Preference Weights</p>
                <div className="space-y-2">
                  {Object.entries(profile.weights).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-slate-600 w-36">{WEIGHT_LABELS[key] || key}</span>
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{ width: `${(val as number) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 w-8 text-right">
                        {Math.round((val as number) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-5 pt-5 border-t border-slate-100 flex gap-3">
            <a
              href="/runs"
              className="flex-1 text-center bg-slate-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors"
            >
              Run Studio →
            </a>
            <a
              href="/listings"
              className="flex-1 text-center border border-slate-200 text-slate-700 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors"
            >
              Browse Listings →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
