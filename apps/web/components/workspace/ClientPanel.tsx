"use client";

import { ClientProfile } from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
  "Active Search": "bg-emerald-50 text-emerald-700 border-emerald-200",
  Shortlisted:    "bg-blue-50 text-blue-600 border-blue-200",
  "Follow-up":    "bg-amber-50 text-amber-700 border-amber-200",
  Closed:         "bg-gray-100 text-gray-500 border-gray-200",
};

const WEIGHT_LABELS: Record<string, string> = {
  commute: "Commute",
  building_quality: "Bldg Quality",
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
    <aside className="flex flex-col gap-3">
      {[64, 100, 72].map((h, i) => (
        <div
          key={i}
          className="bg-gray-100 rounded-xl border border-gray-200 animate-pulse"
          style={{ height: h }}
        />
      ))}
    </aside>
  );
}

export default function ClientPanel({ client }: { client: ClientProfile | null }) {
  if (!client) return <Skeleton />;

  const statusClass = STATUS_STYLES[client.status] ?? STATUS_STYLES["Active Search"];
  const target = client.neighborhoods.length > 0 ? client.neighborhoods.join(" / ") : "—";
  const weights = Object.entries(client.weights).map(([key, value]) => ({
    key, label: WEIGHT_LABELS[key] ?? key, value,
  }));

  return (
    <aside className="flex flex-col gap-3 overflow-y-auto">
      {/* Client card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-gray-900 font-semibold text-sm leading-tight">{client.name}</h2>
            <p className="text-gray-400 text-xs mt-0.5">
              {client.channel} · {client.updated_at ? new Date(client.updated_at).toLocaleDateString() : "—"}
            </p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${statusClass}`}>
            {client.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-gray-400 mb-0.5">Move-in</p>
            <p className="text-gray-800 font-medium">{client.move_in ?? "—"}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-gray-400 mb-0.5">Budget</p>
            <p className="text-emerald-700 font-medium">{formatBudget(client.budget)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5 col-span-2">
            <p className="text-gray-400 mb-0.5">Target</p>
            <p className="text-gray-800 font-medium">{target}</p>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Requirements</p>

        {client.must_haves.length > 0 && (
          <div>
            <p className="text-xs text-emerald-700 font-medium mb-1.5">Must-haves</p>
            <div className="flex flex-wrap gap-1.5">
              {client.must_haves.map((m) => (
                <span key={m} className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full border border-emerald-200">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {client.avoid.length > 0 && (
          <div>
            <p className="text-xs text-red-600 font-medium mb-1.5">Avoid</p>
            <div className="flex flex-wrap gap-1.5">
              {client.avoid.map((a) => (
                <span key={a} className="bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full border border-red-200">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {weights.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 font-medium mb-2">Priorities</p>
            <div className="space-y-1.5">
              {weights.map((w) => (
                <div key={w.key} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-20 flex-shrink-0">{w.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-1">
                    <div
                      className="bg-blue-400 h-1 rounded-full transition-all"
                      style={{ width: `${w.value * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-7 text-right">{Math.round(w.value * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Client notes */}
      {client.notes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Notes</p>
          <ul className="space-y-1.5">
            {client.notes.map((note, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                <span className="text-gray-300 mt-0.5 flex-shrink-0">—</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Shortlist status */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Shortlist</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Saved",    value: client.shortlist.saved    },
            { label: "Sent",     value: client.shortlist.sent     },
            { label: "Liked",    value: client.shortlist.liked    },
            { label: "Rejected", value: client.shortlist.rejected },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100">
              <p className="text-sm font-bold text-gray-800">{s.value}</p>
              <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
