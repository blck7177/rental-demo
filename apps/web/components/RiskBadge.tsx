"use client";

interface Props {
  severity: "low" | "medium" | "high" | string;
  label?: string;
  type?: string;
}

const STYLES: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  high: "bg-red-50 text-red-700 border-red-200",
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
