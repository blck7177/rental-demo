"use client";

import { ClientProfile } from "@/lib/api";

const WEIGHT_LABELS: Record<string, string> = {
  commute: "Commute",
  building_quality: "Building Quality",
  price: "Price / Value",
  amenities: "Amenities",
};

function formatBudget(budget: ClientProfile["budget"]): string {
  const min = budget.min ? `$${budget.min.toLocaleString()}` : "";
  const max = budget.max ? `$${budget.max.toLocaleString()}` : "";
  if (min && max) return `${min} – ${max} / mo`;
  if (max) return `Up to ${max} / mo`;
  if (min) return `From ${min} / mo`;
  return "—";
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-2.5 border-b border-gray-100 last:border-b-0">
      <span className="text-xs text-gray-400 w-32 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-gray-800 flex-1">{value}</span>
    </div>
  );
}

interface Props {
  client: ClientProfile | null;
}

export default function ClientProfileTab({ client }: Props) {
  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-8">
        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mb-3">
          <span className="text-base text-gray-400">P</span>
        </div>
        <p className="text-gray-500 text-sm font-medium">No client selected</p>
      </div>
    );
  }

  const weights = Object.entries(client.weights).map(([key, value]) => ({
    key, label: WEIGHT_LABELS[key] ?? key, value,
  }));

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Name + status header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
        <div>
          <p className="text-base font-semibold text-gray-900">{client.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{client.channel} · {client.unit_type ?? "studio"}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
          client.status === "Active Search"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-gray-100 text-gray-500 border-gray-200"
        }`}>
          {client.status}
        </span>
      </div>

      {/* Core fields */}
      <div className="px-5 py-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-4 pb-1">
          Search Criteria
        </p>
        <Row label="Budget" value={<span className="font-medium text-emerald-700">{formatBudget(client.budget)}</span>} />
        <Row label="Move-in" value={client.move_in ?? "—"} />
        <Row
          label="Neighborhoods"
          value={
            client.neighborhoods.length > 0
              ? client.neighborhoods.join(", ")
              : "—"
          }
        />
        {client.commute_destination && (
          <Row label="Commute to" value={client.commute_destination} />
        )}

        {client.must_haves.length > 0 && (
          <Row
            label="Must-haves"
            value={
              <div className="flex flex-wrap gap-1">
                {client.must_haves.map((m) => (
                  <span key={m} className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full border border-emerald-200">
                    {m}
                  </span>
                ))}
              </div>
            }
          />
        )}

        {client.avoid.length > 0 && (
          <Row
            label="Avoid"
            value={
              <div className="flex flex-wrap gap-1">
                {client.avoid.map((a) => (
                  <span key={a} className="bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full border border-red-200">
                    {a}
                  </span>
                ))}
              </div>
            }
          />
        )}
      </div>

      {/* Preference weights */}
      {weights.length > 0 && (
        <div className="px-5 pb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-4 pb-3">
            Preference Weights
          </p>
          <div className="space-y-2.5">
            {weights.map((w) => (
              <div key={w.key} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-28 flex-shrink-0">{w.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-blue-400 h-1.5 rounded-full transition-all"
                    style={{ width: `${w.value * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-8 text-right">{Math.round(w.value * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shortlist summary */}
      <div className="px-5 pb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-4 pb-3">
          Shortlist Summary
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Saved", value: client.shortlist.saved },
            { label: "Sent", value: client.shortlist.sent },
            { label: "Liked", value: client.shortlist.liked },
            { label: "Rejected", value: client.shortlist.rejected },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-center">
              <p className="text-sm font-semibold text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Agent notes */}
      {client.notes.length > 0 && (
        <div className="px-5 pb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-4 pb-2">
            Agent Notes
          </p>
          <ul className="space-y-1.5">
            {client.notes.map((note, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="text-gray-300 mt-0.5 flex-shrink-0">—</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
