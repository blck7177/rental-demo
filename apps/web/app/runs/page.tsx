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

const PIPELINE_LABELS = ["Search Queries", "Candidate URLs", "Fetch & Extract", "Validate", "DB Insert"];

const DEFAULT_STEPS: Step[] = [
  { step: "search_queries_generated", label: "Search queries generated", count: 4 },
  { step: "candidates_found", label: "Candidate URLs found", count: 18 },
  { step: "fetch_attempted", label: "Pages fetched", count: 15 },
  { step: "fetch_succeeded", label: "Successfully fetched", count: 13 },
  { step: "structured", label: "Structured via LLM", count: 13 },
  { step: "validated", label: "Passed validation", count: 13 },
  { step: "db_inserted", label: "Inserted into database", count: 13 },
];

export default function RunStudioPage() {
  const [mode, setMode] = useState<Mode>("demo");
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animStep, setAnimStep] = useState(-1);

  async function startRun() {
    setLoading(true);
    setError(null);
    setRunResult(null);
    setAnimStep(-1);

    try {
      if (mode === "demo") {
        const result = await startDemoRun();
        const steps = (result as { steps?: Step[] }).steps || DEFAULT_STEPS;
        for (let i = 0; i < steps.length; i++) {
          setAnimStep(i);
          await new Promise((r) => setTimeout(r, 320));
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

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Run Studio</h1>
        <p className="text-slate-500 text-sm mt-1">Search → Fetch → Extract → Validate → Database</p>
      </div>

      {/* Pipeline diagram */}
      <div className="flex items-center justify-center gap-2 mb-8 p-5 bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto">
        {PIPELINE_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-shrink-0">
            <div className={`text-center transition-all duration-300 ${i < totalCompleted ? "opacity-100" : "opacity-25"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold mx-auto mb-1 transition-colors ${i < totalCompleted ? "bg-emerald-500" : "bg-slate-300"}`}>
                {i < totalCompleted ? "✓" : i + 1}
              </div>
              <p className="text-xs text-slate-600 max-w-[72px] text-center leading-tight">{label}</p>
            </div>
            {i < PIPELINE_LABELS.length - 1 && (
              <div className={`h-0.5 w-6 transition-colors ${i < totalCompleted - 1 ? "bg-emerald-400" : "bg-slate-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Mode toggle + start button */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <p className="text-sm font-semibold text-slate-700 mb-3">Run Mode</p>
        <div className="flex gap-3 mb-4">
          {([
            { id: "demo" as Mode, label: "Stable Demo", desc: "Uses seed data — always succeeds. Recommended for presentations." },
            { id: "live" as Mode, label: "Live OpenClaw Run", desc: "Triggers real nyc-rentals-openclaw pipeline. Requires API keys and may have partial results." },
          ]).map(({ id, label, desc }) => (
            <button key={id} onClick={() => setMode(id)}
              className={`flex-1 p-4 rounded-xl border text-left transition-colors ${mode === id ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs mt-0.5 opacity-70">{desc}</p>
            </button>
          ))}
        </div>
        <button onClick={startRun} disabled={loading}
          className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors w-full">
          {loading ? "Running..." : `🚀 Start ${mode === "demo" ? "Demo" : "Live"} Run`}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-red-700 text-sm">{error}</div>}

      {/* Pipeline steps */}
      <AnimatePresence>
        {(loading || runResult) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-xl p-6 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800">
                {loading ? "Pipeline running..." : `${runResult?.mode === "live" ? "Live" : "Demo"} run · ${runResult?.run_id}`}
              </h2>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                runResult?.status === "complete" ? "bg-emerald-50 text-emerald-600" :
                runResult?.status === "running" ? "bg-blue-50 text-blue-600 animate-pulse" :
                runResult?.status === "unavailable" ? "bg-yellow-50 text-yellow-600" :
                "bg-slate-100 text-slate-500"
              }`}>
                {loading ? "running..." : runResult?.status}
              </span>
            </div>

            {runResult?.status === "unavailable" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-yellow-700 text-sm">{runResult.message}</div>
            )}
            {runResult?.status === "running" && mode === "live" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-blue-700 text-sm">
                Live pipeline running in background. Results appear when complete.
              </div>
            )}

            <div className="space-y-2">
              {stepsToShow.map((step, i) => {
                const isDone = runResult?.status === "complete" || i <= animStep;
                const isCurrent = loading && i === animStep;
                return (
                  <motion.div key={step.step}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: isDone ? 1 : 0.3, x: 0 }} transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-lg ${isDone ? "bg-emerald-50 border border-emerald-100" : "bg-slate-50 border border-slate-100"}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isDone ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"} ${isCurrent ? "animate-pulse" : ""}`}>
                      {isDone ? "✓" : i + 1}
                    </span>
                    <span className="flex-1 text-sm text-slate-700">{step.label}</span>
                    {isDone && <span className="text-emerald-600 font-semibold text-sm">{step.count}</span>}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary */}
      <AnimatePresence>
        {runResult?.status === "complete" && runResult.summary && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-5">
            <h2 className="font-semibold text-emerald-800 mb-3">Run Summary</h2>
            <div className="grid grid-cols-3 gap-4 text-center mb-3">
              <div><p className="text-3xl font-bold text-emerald-700">{runResult.summary.candidates_found}</p><p className="text-xs text-emerald-600">URLs Found</p></div>
              <div><p className="text-3xl font-bold text-emerald-700">{runResult.summary.fetch_succeeded}</p><p className="text-xs text-emerald-600">Fetched</p></div>
              <div><p className="text-3xl font-bold text-emerald-700">{runResult.summary.db_inserted}</p><p className="text-xs text-emerald-600">In Database</p></div>
            </div>
            {runResult.summary.sources && <p className="text-sm text-emerald-700"><strong>Sources:</strong> {runResult.summary.sources.join(", ")}</p>}
            {runResult.summary.neighborhoods && <p className="text-sm text-emerald-700 mt-1"><strong>Neighborhoods:</strong> {runResult.summary.neighborhoods.join(", ")}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {runResult ? (
        <div className="flex gap-3">
          <Link href="/listings" className="flex-1 text-center bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">
            View Listings Database →
          </Link>
          <button onClick={startRun} className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition-colors">
            Run Again
          </button>
        </div>
      ) : (
        !loading && (
          <Link href="/listings" className="block text-center border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors">
            Skip → Browse Existing Listings
          </Link>
        )
      )}
    </div>
  );
}
