"use client";

import { motion } from "framer-motion";

export type WorkflowStepId = "intake" | "search" | "analyze" | "compare" | "research" | "message" | "followup";

export interface WorkflowStep {
  id: WorkflowStepId;
  label: string;
  shortLabel: string;
}

const STEPS: WorkflowStep[] = [
  { id: "intake", label: "Intake", shortLabel: "Intake" },
  { id: "search", label: "Search", shortLabel: "Search" },
  { id: "analyze", label: "Analyze", shortLabel: "Analyze" },
  { id: "compare", label: "Compare", shortLabel: "Compare" },
  { id: "research", label: "Research", shortLabel: "Research" },
  { id: "message", label: "Message", shortLabel: "Msg" },
  { id: "followup", label: "Follow-up", shortLabel: "F/U" },
];

interface Props {
  currentTask: string;
  activeStep: WorkflowStepId;
  completedSteps: WorkflowStepId[];
  isLoading?: boolean;
}

export default function WorkflowProgress({ currentTask, activeStep, completedSteps, isLoading }: Props) {
  return (
    <div className="bg-slate-800/80 rounded-xl border border-white/10 p-4 flex-shrink-0">
      {/* Current task */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 mt-0.5">
          {isLoading ? (
            <span className="block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          ) : (
            <span className="block w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Task</p>
          <p className="text-sm text-slate-200 leading-snug">{currentTask}</p>
        </div>
      </div>

      {/* Workflow steps */}
      <div className="flex items-center gap-1 flex-wrap">
        {STEPS.map((step, i) => {
          const isDone = completedSteps.includes(step.id);
          const isActive = step.id === activeStep;
          return (
            <div key={step.id} className="flex items-center gap-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : isDone
                    ? "bg-slate-700/60 text-slate-400 border border-white/5"
                    : "text-slate-600 border border-transparent"
                }`}
              >
                {isDone && !isActive && (
                  <span className="text-emerald-500 text-xs">✓</span>
                )}
                {isActive && isLoading && (
                  <span className="block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                )}
                <span>{step.shortLabel}</span>
              </motion.div>
              {i < STEPS.length - 1 && (
                <span className={`text-xs ${isDone ? "text-slate-600" : "text-slate-800"}`}>›</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
