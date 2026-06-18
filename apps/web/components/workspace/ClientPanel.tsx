"use client";

import { motion } from "framer-motion";
import { ClientProfile } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  "Active Search": "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  Shortlisted: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  "Follow-up": "bg-amber-500/15 text-amber-400 border-amber-500/25",
  Closed: "bg-slate-500/15 text-slate-400 border-slate-500/25",
};

const WEIGHT_LABELS: Record<string, string> = {
  commute: "Commute",
  building_quality: "Building Quality",
  price: "Price / Value",
  amenities: "Amenities",
};

function formatBudget(budget: ClientProfile["budget"]): string {
  const min = budget.min ? `$${budget.min.toLocaleString()}` : "";
  const max = budget.max ? `$${budget.max.toLocaleString()}` : "";
  if (min && max) return `${min}–${max}`;
  if (max) return `Up to ${max}`;
  if (min) return `From ${min}`;
  return "—";
}

function Skeleton() {
  return (
    <aside className="flex flex-col gap-4">
      {[72, 120, 80].map((h, i) => (
        <div
          key={i}
          className="bg-slate-800/80 rounded-xl border border-white/10 animate-pulse"
          style={{ height: h }}
        />
      ))}
    </aside>
  );
}

export default function ClientPanel({ client }: { client: ClientProfile | null }) {
  if (!client) return <Skeleton />;

  const statusClass = STATUS_COLORS[client.status] ?? STATUS_COLORS["Active Search"];
  const target = client.neighborhoods.length > 0 ? client.neighborhoods.join(" / ") : "—";
  const weights = Object.entries(client.weights).map(([key, value]) => ({
    key,
    label: WEIGHT_LABELS[key] ?? key,
    value,
  }));

  return (
    <aside className="flex flex-col gap-4 overflow-y-auto">
      {/* Client card */}
      <div className="bg-slate-800/80 rounded-xl border border-white/10 p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-white font-semibold text-base leading-tight">{client.name}</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {client.channel} · {client.updated_at ? new Date(client.updated_at).toLocaleDateString() : "—"}
            </p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${statusClass}`}>
            {client.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900/60 rounded-lg p-2.5">
            <p className="text-slate-500 mb-0.5">Move-in</p>
            <p className="text-white font-medium">{client.move_in ?? "—"}</p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2.5">
            <p className="text-slate-500 mb-0.5">Budget</p>
            <p className="text-emerald-400 font-medium">{formatBudget(client.budget)}</p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2.5 col-span-2">
            <p className="text-slate-500 mb-0.5">Target</p>
            <p className="text-white font-medium">{target}</p>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-slate-800/80 rounded-xl border border-white/10 p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Requirements</p>

        {client.must_haves.length > 0 && (
          <div>
            <p className="text-xs text-emerald-500 font-medium mb-1.5">Must-haves</p>
            <div className="flex flex-wrap gap-1.5">
              {client.must_haves.map((m) => (
                <span key={m} className="bg-emerald-500/10 text-emerald-300 text-xs px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {client.avoid.length > 0 && (
          <div>
            <p className="text-xs text-red-400 font-medium mb-1.5">Avoid</p>
            <div className="flex flex-wrap gap-1.5">
              {client.avoid.map((a) => (
                <span key={a} className="bg-red-500/10 text-red-300 text-xs px-2 py-0.5 rounded-full border border-red-500/20">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {weights.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 font-medium mb-2">Preference Weights</p>
            <div className="space-y-1.5">
              {weights.map((w) => (
                <div key={w.key} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-24 flex-shrink-0">{w.label}</span>
                  <div className="flex-1 bg-slate-700 rounded-full h-1">
                    <motion.div
                      className="bg-emerald-500 h-1 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${w.value * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-7 text-right">{Math.round(w.value * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Client notes */}
      {client.notes.length > 0 && (
        <div className="bg-slate-800/80 rounded-xl border border-white/10 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Agent Notes</p>
          <ul className="space-y-1.5">
            {client.notes.map((note, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                <span className="text-slate-600 mt-0.5 flex-shrink-0">—</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Shortlist status */}
      <div className="bg-slate-800/80 rounded-xl border border-white/10 p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Shortlist Status</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Saved", value: client.shortlist.saved, color: "text-slate-300" },
            { label: "Sent", value: client.shortlist.sent, color: "text-emerald-400" },
            { label: "Liked", value: client.shortlist.liked, color: "text-emerald-400" },
            { label: "Rejected", value: client.shortlist.rejected, color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900/60 rounded-lg p-2 text-center">
              <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
              <p className="text-slate-600 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
