"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { postIntake, UserProfile } from "@/lib/api";
import WorkflowStepper from "@/components/WorkflowStepper";
import StatCard from "@/components/StatCard";
import Link from "next/link";

const DEMO_NL = "I'm looking for a studio in Long Island City under $3,200. I care about commute to Midtown, in-unit laundry, quiet building, and avoiding bad management.";

const WEIGHT_LABELS: Record<string, string> = {
  price: "💰 Price / Value",
  commute: "🚇 Commute",
  building_quality: "🏢 Building Quality",
  amenities: "✨ Amenities",
};

export default function CommandCenterPage() {
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
      setError(err instanceof Error ? err.message : "API unavailable — start the backend on port 8000.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1.5 rounded-full mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Demo Mode · LIC Studio Search
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 leading-tight">
              NYC Rental<br /><span className="text-emerald-400">Intelligence Agent</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl">
              From rental requirements to explainable shortlists — AI-powered workflow in 8 steps.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatCard value={13} label="Listings structured" sub="LIC Studios" accent="emerald" />
            <StatCard value={13} label="Buildings reviewed" sub="All enriched" accent="blue" />
            <StatCard value="$2,350–$3,200" label="Rent range" sub="Monthly" accent="purple" />
            <StatCard value="10–28 min" label="Midtown commute" sub="Via 7/N/W/E/M trains" accent="amber" />
          </div>

          <WorkflowStepper activeStep="intake" completedSteps={[]} />
        </div>
      </div>

      {/* 3-col layout */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Intake form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 rounded-2xl border border-white/10 p-6">
            <h2 className="text-white font-semibold text-lg mb-1">Define your requirements</h2>
            <p className="text-slate-400 text-sm mb-4">Describe what you need in plain English — AI parses it into a structured search profile.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={nlText}
                onChange={(e) => setNlText(e.target.value)}
                rows={4}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
              />
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setNlText(DEMO_NL)} className="text-xs text-emerald-400 hover:text-emerald-300">
                  Use demo example
                </button>
                <button type="submit" disabled={loading || !nlText.trim()}
                  className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50 transition-colors">
                  {loading ? "Parsing..." : "Parse Requirements →"}
                </button>
              </div>
            </form>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-red-900/30 border border-red-700/50 rounded-xl p-4 text-red-300 text-sm">
              {error}
            </motion.div>
          )}

          <AnimatePresence>
            {profile && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800 rounded-2xl border border-emerald-500/30 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-emerald-400 text-xl">✓</span>
                  <h3 className="text-white font-semibold">Search Profile Created</h3>
                  <span className="ml-auto text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                    {profile.profile_id?.slice(0, 20)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Budget</p>
                    <p className="text-2xl font-bold text-emerald-400">≤ ${profile.budget_max?.toLocaleString()}<span className="text-sm font-normal text-slate-400">/mo</span></p>
                  </div>
                  <div className="bg-slate-900 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Unit Type</p>
                    <p className="text-2xl font-bold text-white">{profile.bedrooms === 0 ? "Studio" : `${profile.bedrooms}BR`}</p>
                  </div>

                  <div className="bg-slate-900 rounded-xl p-4 col-span-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Target Neighborhoods</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.neighborhoods?.map((n) => (
                        <span key={n} className="bg-slate-700 text-white text-sm px-3 py-1 rounded-full">{n}</span>
                      ))}
                    </div>
                  </div>

                  {profile.must_haves?.length > 0 && (
                    <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-4">
                      <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2">Must Haves</p>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.must_haves.map((m) => (
                          <span key={m} className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full border border-emerald-500/20">✓ {m}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.avoid?.length > 0 && (
                    <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-4">
                      <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">Avoid</p>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.avoid.map((a) => (
                          <span key={a} className="bg-red-500/20 text-red-300 text-xs px-2 py-0.5 rounded-full border border-red-500/20">✗ {a}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.weights && (
                    <div className="bg-slate-900 rounded-xl p-4 col-span-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Preference Weights</p>
                      <div className="space-y-2">
                        {Object.entries(profile.weights).map(([key, val]) => (
                          <div key={key} className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 w-36">{WEIGHT_LABELS[key] || key}</span>
                            <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                              <motion.div className="bg-emerald-500 h-1.5 rounded-full"
                                initial={{ width: 0 }} animate={{ width: `${(val as number) * 100}%` }}
                                transition={{ duration: 0.6, delay: 0.1 }} />
                            </div>
                            <span className="text-xs font-semibold text-slate-300 w-8 text-right">{Math.round((val as number) * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-5 border-t border-white/10 flex gap-3">
                  <Link href="/runs" className="flex-1 text-center bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-500 transition-colors">
                    Run Studio →
                  </Link>
                  <Link href="/listings" className="flex-1 text-center border border-white/10 text-slate-300 py-2.5 rounded-xl text-sm hover:bg-white/5 transition-colors">
                    Browse Listings →
                  </Link>
                  <Link href="/recommendations" className="flex-1 text-center border border-emerald-500/30 text-emerald-400 py-2.5 rounded-xl text-sm hover:bg-emerald-500/10 transition-colors">
                    Top 3 Picks →
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Workflow guide */}
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-2xl border border-white/10 p-5">
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Demo Workflow</h3>
            <WorkflowStepper activeStep="intake" completedSteps={profile ? ["intake"] : []} vertical />
          </div>

          <div className="bg-slate-800 rounded-2xl border border-white/10 p-5 space-y-3">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide">Quick Actions</h3>
            {[
              { href: "/runs", label: "View Run Studio", desc: "Search → Database pipeline" },
              { href: "/listings", label: "Browse Listings", desc: "13 LIC studios structured" },
              { href: "/query", label: "NL Search", desc: "Ask in plain English" },
              { href: "/recommendations", label: "Top 3 Recommendations", desc: "AI-selected shortlist" },
              { href: "/compare", label: "Compare Listings", desc: "Side-by-side analysis" },
            ].map((action) => (
              <Link key={action.href} href={action.href}
                className="flex items-center justify-between p-3 rounded-xl border border-white/5 hover:bg-white/5 hover:border-white/10 transition-colors group">
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">{action.label}</p>
                  <p className="text-xs text-slate-500">{action.desc}</p>
                </div>
                <span className="text-slate-500 group-hover:text-emerald-400 transition-colors text-lg">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
