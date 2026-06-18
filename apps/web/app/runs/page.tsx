"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { startDemoRun } from "@/lib/api";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Step { step: string; label: string; count: number; }
interface RunResult {
  run_id: string; status: string; mode: string;
  steps?: Step[];
  summary?: { candidates_found?: number; fetch_succeeded?: number; db_inserted?: number; sources?: string[]; neighborhoods?: string[]; };
  message?: string;
  openclaw_available?: boolean;
}

type Mode = "demo" | "live";

const PIPELINE_STAGES = [
  { id: "search", label: "Search Queries", icon: "🔍" },
  { id: "candidates", label: "Candidate URLs", icon: "🔗" },
  { id: "fetch", label: "Fetch & Extract", icon: "⬇" },
  { id: "validate", label: "Validate", icon: "✓" },
  { id: "db", label: "DB Insert", icon: "🗄" },
];

const DEFAULT_STEPS: Step[] = [
  { step: "search_queries_generated", label: "Search queries generated", count: 4 },
  { step: "candidates_found", label: "Candidate URLs found", count: 18 },
  { step: "fetch_attempted", label: "Pages fetched", count: 15 },
  { step: "fetch_succeeded", label: "Successfully fetched", count: 13 },
  { step: "structured", label: "Structured via LLM", count: 13 },
  { step: "validated", label: "Passed validation", count: 13 },
  { step: "db_inserted", label: "Inserted into database", count: 13 },
];

const ARTIFACTS = [
  { name: "candidate_pool.jsonl", desc: "18 candidate URLs discovered", icon: "🔗" },
  { name: "search_ledger.jsonl", desc: "4 search queries + results", icon: "📋" },
  { name: "structured_listings.jsonl", desc: "13 AI-structured listings", icon: "✨" },
  { name: "review_research.json", desc: "13 building reputation reports", icon: "📊" },
];

const SAMPLE_QUERIES = [
  'site:streeteasy.com "Long Island City" studio under 3200',
  'site:renthop.com LIC studio "no fee" 2024',
  'site:apartments.com "Hunters Point" studio available',
  'site:streeteasy.com "Queens Plaza" studio laundry',
];

export default function RunStudioPage() {
  const [mode, setMode] = useState<Mode>("demo");
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animStep, setAnimStep] = useState(-1);
  const [showQueries, setShowQueries] = useState(false);

  async function startRun() {
    setLoading(true);
    setError(null);
    setRunResult(null);
    setAnimStep(-1);
    setShowQueries(false);

    try {
      if (mode === "demo") {
        setShowQueries(true);
        const result = await startDemoRun();
        const steps = (result as { steps?: Step[] }).steps || DEFAULT_STEPS;
        for (let i = 0; i < steps.length; i++) {
          setAnimStep(i);
          await new Promise((r) => setTimeout(r, 380));
        }
        setRunResult(result as RunResult);
      } else {
        const res = await fetch(`${API_BASE}/api/runs/live`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "live" }),
        });
        const data = await res.json();
        setRunResult(data as RunResult);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setLoading(false);
    }
  }

  const stepsToShow = runResult?.steps || DEFAULT_STEPS;
  const totalCompleted = runResult?.status === "complete" ? stepsToShow.length : loading ? animStep + 1 : 0;
  const isComplete = runResult?.status === "complete";

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            Run Studio
          </span>
          {loading && (
            <span className="text-xs text-blue-400 animate-pulse bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
              Pipeline running...
            </span>
          )}
          {isComplete && (
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              Run complete ✓
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-white">Pipeline Execution</h1>
        <p className="text-slate-400 mt-1">Search → Fetch → Extract → Validate → Database</p>
      </div>

      {/* Pipeline stages bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 overflow-x-auto">
        <div className="flex items-center justify-center gap-3 min-w-max mx-auto">
          {PIPELINE_STAGES.map((stage, i) => {
            const stageCompleted = i < Math.ceil((totalCompleted / stepsToShow.length) * PIPELINE_STAGES.length);
            return (
              <div key={stage.id} className="flex items-center gap-3">
                <motion.div
                  animate={{ opacity: stageCompleted ? 1 : 0.3, scale: stageCompleted ? 1 : 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg transition-all duration-500 ${
                    stageCompleted
                      ? "bg-emerald-500 shadow-lg shadow-emerald-500/30"
                      : "bg-white/10 border border-white/10"
                  }`}>
                    {stageCompleted ? "✓" : stage.icon}
                  </div>
                  <p className="text-xs text-slate-400 text-center leading-tight max-w-[72px]">{stage.label}</p>
                </motion.div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <motion.div
                    className={`h-0.5 w-10 rounded-full transition-colors duration-500 ${
                      stageCompleted ? "bg-emerald-500" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: mode + steps */}
        <div className="lg:col-span-2 space-y-5">
          {/* Mode selector */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Run Mode</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {([
                { id: "demo" as Mode, label: "Stable Demo", badge: "Recommended", desc: "Uses seed data — always succeeds. Best for presentations." },
                { id: "live" as Mode, label: "Live OpenClaw Run", badge: "Advanced", desc: "Triggers real pipeline. Requires API keys + local setup." },
              ]).map(({ id, label, badge, desc }) => (
                <button key={id} onClick={() => setMode(id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    mode === id
                      ? "border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                      : "border-white/10 bg-white/3 hover:bg-white/5"
                  }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`font-semibold text-sm ${mode === id ? "text-emerald-300" : "text-white"}`}>{label}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      id === "demo" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"
                    }`}>{badge}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </button>
              ))}
            </div>
            <button onClick={startRun} disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running pipeline...
                </>
              ) : (
                `Start ${mode === "demo" ? "Demo" : "Live"} Run →`
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">{error}</div>
          )}

          {/* Search queries panel */}
          <AnimatePresence>
            {showQueries && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Generated Search Queries</p>
                <div className="space-y-2">
                  {SAMPLE_QUERIES.map((q, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.12 }}
                      className="flex items-start gap-2 bg-slate-900/50 rounded-lg px-3 py-2">
                      <span className="text-emerald-400 text-xs mt-0.5 flex-shrink-0">→</span>
                      <code className="text-xs text-slate-300 font-mono break-all">{q}</code>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pipeline steps */}
          <AnimatePresence>
            {(loading || runResult) && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pipeline Steps</p>
                  {runResult?.run_id && (
                    <span className="font-mono text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded">
                      {runResult.run_id}
                    </span>
                  )}
                </div>

                {runResult?.status === "unavailable" && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4 text-yellow-300 text-sm">
                    {runResult.message}
                  </div>
                )}

                <div className="space-y-2">
                  {stepsToShow.map((step, i) => {
                    const isDone = isComplete || i <= animStep;
                    const isCurrent = loading && i === animStep;
                    return (
                      <motion.div key={step.step}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: isDone ? 1 : 0.3, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                          isDone
                            ? "bg-emerald-500/10 border-emerald-500/20"
                            : "bg-white/3 border-white/5"
                        }`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isDone ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-500"
                        } ${isCurrent ? "animate-pulse" : ""}`}>
                          {isDone ? "✓" : i + 1}
                        </span>
                        <span className={`flex-1 text-sm ${isDone ? "text-slate-200" : "text-slate-500"}`}>
                          {step.label}
                        </span>
                        {isDone && (
                          <span className="text-emerald-400 font-bold text-sm tabular-nums">{step.count}</span>
                        )}
                        {isCurrent && (
                          <span className="w-3 h-3 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary */}
          <AnimatePresence>
            {isComplete && runResult?.summary && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5">
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-4">Run Summary</p>
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  {[
                    { val: runResult.summary.candidates_found, label: "URLs Found" },
                    { val: runResult.summary.fetch_succeeded, label: "Fetched" },
                    { val: runResult.summary.db_inserted, label: "In Database" },
                  ].map(({ val, label }) => (
                    <div key={label} className="bg-emerald-500/10 rounded-xl py-3 px-2">
                      <p className="text-3xl font-bold text-emerald-400">{val}</p>
                      <p className="text-xs text-emerald-600 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
                {runResult.summary.sources && (
                  <p className="text-sm text-emerald-300"><span className="text-emerald-500">Sources:</span> {runResult.summary.sources.join(", ")}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <div className="flex gap-3">
            {runResult ? (
              <>
                <Link href="/listings" className="flex-1 text-center bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  View Listings Database →
                </Link>
                <button onClick={startRun} className="px-5 py-2.5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm rounded-xl transition-colors">
                  Run Again
                </button>
              </>
            ) : !loading && (
              <Link href="/listings" className="block text-center border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 py-2.5 rounded-xl text-sm w-full transition-colors">
                Skip → Browse Existing Listings
              </Link>
            )}
          </div>
        </div>

        {/* Right column: artifacts + info */}
        <div className="space-y-5">
          {/* Artifacts panel */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Pipeline Artifacts</p>
            <div className="space-y-2.5">
              {ARTIFACTS.map((a, i) => (
                <motion.div key={a.name}
                  animate={{ opacity: isComplete ? 1 : 0.3 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                    isComplete ? "bg-slate-900/50 border-white/10" : "bg-white/3 border-white/5"
                  }`}>
                  <span className="text-base flex-shrink-0 mt-0.5">{a.icon}</span>
                  <div>
                    <p className={`text-xs font-mono font-medium ${isComplete ? "text-slate-200" : "text-slate-500"}`}>
                      {a.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{a.desc}</p>
                  </div>
                  {isComplete && (
                    <span className="ml-auto text-emerald-500 text-xs flex-shrink-0">✓</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Architecture info */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Architecture</p>
            <div className="space-y-2 text-xs text-slate-400">
              {[
                { label: "Search", value: "4 targeted queries/source" },
                { label: "Sources", value: "StreetEasy · RentHop · Apartments.com" },
                { label: "Extraction", value: "Claude / GPT structured output" },
                { label: "Validation", value: "JSON Schema + field rules" },
                { label: "Storage", value: "JSONL append-only DB" },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-2">
                  <span className="text-slate-600 w-20 flex-shrink-0">{label}</span>
                  <span className="text-slate-400">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <Link href="/listings"
            className="block text-center bg-slate-900/50 border border-white/10 hover:bg-white/5 text-slate-300 py-2.5 rounded-xl text-sm transition-colors">
            Browse 13 Seeded Listings →
          </Link>
        </div>
      </div>
    </div>
  );
}
