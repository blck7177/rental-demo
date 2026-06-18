"use client";

interface Props {
  severity: "low" | "medium" | "high" | string;
  label?: string;
  type?: string;
}

const STYLES: Record<string, string> = {
  low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  medium: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
  high: "bg-red-500/15 text-red-300 border-red-500/25",
};

const ICONS: Record<string, string> = { low: "✓", medium: "⚠", high: "⛔" };

export default function RiskBadge({ severity, label, type }: Props) {
  const style = STYLES[severity] || STYLES.medium;
  const icon = ICONS[severity] || "⚠";
  const text = label || type || severity;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${style}`}>
      <span>{icon}</span>
      <span className="capitalize">{text}</span>
    </span>
  );
}
