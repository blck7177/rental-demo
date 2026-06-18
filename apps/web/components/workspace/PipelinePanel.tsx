"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { startDemoRun } from "@/lib/api";

interface PipelineStep {
  step: string;
  label: string;
  count: number;
}

interface RunResult {
  run_id: string;
  status: string;
  steps?: PipelineStep[];
  summary?: {
    candidates_found?: number;
    fetch_succeeded?: number;
    db_inserted?: number;
    sources?: string[];
    neighborhoods?: string[];
  };
}

const STEP_ICONS: Record<string, string> = {
  search_queries_generated: "🔍",
  candidates_found: "🔗",
  fetch_attempted: "⬇",
  fetch_succeeded: "✓",
  structured: "✨",
  validated: "🛡",
  db_inserted: "🗄",
};

interface Props {
  onRunComplete?: (insertedCount: number) => void;
}

export default function PipelinePanel({ onRunComplete }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [animStep, setAnimStep] = useState(-1);

  async function handleDemoRun() {
    setLoading(true);
    setError(null);
    setResult(null);
    setAnimStep(-1);

    try {
      const data = await startDemoRun();
      setResult(data as unknown as RunResult);
      // Animate through steps
      const steps = (data as unknown as RunResult).steps ?? [];
      for (let i = 0; i < steps.length; i++) {
        await new Promise((r) => setTimeout(r, 260));
        setAnimStep(i);
      }
      onRunComplete?.(data.summary?.["db_inserted"] as number ?? 13);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed — ensure backend is running on port 8000");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-800/80 rounded-xl border border-white/10 overflow-hidden flex-shrink-0">
      {/* Header / toggle */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-sm">🔄</span>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Search Pipeline
          </p>
          {result && (
            <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {result.summary?.db_inserted ?? 13} imported
            </span>
          )}
        </div>
        <span className={`text-slate-600 text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
              {/* Trigger button */}
              <button
                onClick={handleDemoRun}
                disabled={loading}
                className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 border border-white/10 text-slate-200 text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Pipeline Running...
                  </>
                ) : (
                  <>
                    <span>▶</span>
                    Run Demo Pipeline for Emily
                  </>
                )}
              </button>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              {/* Pipeline steps */}
              {result?.steps && (
                <div className="space-y-1.5">
                  {result.steps.map((step, i) => (
                    <motion.div
                      key={step.step}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: animStep >= i ? 1 : 0.25, x: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`flex items-center gap-2.5 text-xs ${
                        animStep >= i ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      <span className="text-sm w-4 text-center flex-shrink-0">
                        {animStep >= i ? STEP_ICONS[step.step] ?? "✓" : "○"}
                      </span>
                      <span className="flex-1">{step.label}</span>
                      <span className={`font-semibold tabular-nums ${
                        animStep >= i ? "text-emerald-400" : "text-slate-700"
                      }`}>
                        {step.count}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Summary */}
              {result?.summary && animStep >= (result.steps?.length ?? 0) - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-emerald-300"
                >
                  Pipeline complete · {result.summary.db_inserted ?? 13} listings imported from{" "}
                  {result.summary.sources?.join(", ") ?? "streeteasy.com, renthop.com"}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
