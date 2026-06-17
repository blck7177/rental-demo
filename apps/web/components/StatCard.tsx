"use client";
import { motion } from "framer-motion";

interface Props {
  value: string | number;
  label: string;
  sub?: string;
  accent?: "emerald" | "blue" | "purple" | "amber";
}

const ACCENT: Record<string, string> = {
  emerald: "text-emerald-400",
  blue: "text-blue-400",
  purple: "text-purple-400",
  amber: "text-amber-400",
};

export default function StatCard({ value, label, sub, accent = "emerald" }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5"
    >
      <p className={`text-3xl font-bold ${ACCENT[accent]}`}>{value}</p>
      <p className="text-white/80 text-sm font-medium mt-1">{label}</p>
      {sub && <p className="text-white/40 text-xs mt-0.5">{sub}</p>}
    </motion.div>
  );
}
