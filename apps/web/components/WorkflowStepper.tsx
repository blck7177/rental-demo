"use client";
import { motion } from "framer-motion";
import Link from "next/link";

export interface WorkflowStep {
  id: string;
  label: string;
  href: string;
}

const DEFAULT_STEPS: WorkflowStep[] = [
  { id: "intake", label: "Intake", href: "/" },
  { id: "runs", label: "Run Studio", href: "/runs" },
  { id: "listings", label: "Listings", href: "/listings" },
  { id: "query", label: "NL Query", href: "/query" },
  { id: "fit", label: "Fit Analysis", href: "/listings" },
  { id: "compare", label: "Compare", href: "/compare" },
  { id: "reviews", label: "Reviews", href: "/listings" },
  { id: "push", label: "Push", href: "/notify" },
];

interface Props {
  activeStep?: string;
  completedSteps?: string[];
  steps?: WorkflowStep[];
  vertical?: boolean;
}

export default function WorkflowStepper({ activeStep, completedSteps = [], steps = DEFAULT_STEPS, vertical = false }: Props) {
  if (vertical) {
    return (
      <div className="flex flex-col gap-1">
        {steps.map((step, i) => {
          const isDone = completedSteps.includes(step.id);
          const isActive = step.id === activeStep;
          return (
            <Link key={step.id} href={step.href}>
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  isActive ? "bg-emerald-500/20 text-emerald-300" : isDone ? "text-white/70 hover:bg-white/5" : "text-white/30 hover:bg-white/5"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ${
                  isActive ? "bg-emerald-500 border-emerald-500 text-white" : isDone ? "bg-white/20 border-white/20 text-white" : "border-white/20 text-white/30"
                }`}>
                  {isDone ? "✓" : i + 1}
                </span>
                <span className="text-sm font-medium">{step.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {steps.map((step, i) => {
        const isDone = completedSteps.includes(step.id);
        const isActive = step.id === activeStep;
        return (
          <div key={step.id} className="flex items-center gap-1">
            <Link href={step.href}>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  isActive ? "bg-emerald-500 text-white" : isDone ? "bg-white/15 text-white/70" : "bg-white/5 text-white/30"
                }`}
              >
                {isDone ? "✓ " : ""}{step.label}
              </motion.span>
            </Link>
            {i < steps.length - 1 && <span className="text-white/20 text-xs">→</span>}
          </div>
        );
      })}
    </div>
  );
}
