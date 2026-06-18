"use client";

import { useState } from "react";
import { ClientProfile } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  "Active Search": "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  Shortlisted: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  "Follow-up": "bg-amber-500/15 text-amber-400 border-amber-500/25",
  Closed: "bg-slate-500/15 text-slate-400 border-slate-500/25",
};

interface Props {
  clients: ClientProfile[];
  activeClientId: string;
  onSelect: (client: ClientProfile) => void;
}

export default function ClientSelector({ clients, activeClientId, onSelect }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (clients.length === 0) {
    return (
      <div className="bg-slate-800/80 rounded-xl border border-white/10 p-3">
        <p className="text-xs text-slate-500 text-center py-2">加载客户列表...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Clients</p>
        <div className="relative">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 bg-slate-700/50 hover:bg-slate-700 border border-white/5 rounded-lg px-2 py-1 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            <span>New</span>
          </button>
          {showTooltip && (
            <div className="absolute right-0 top-full mt-1.5 z-50 bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 whitespace-nowrap shadow-xl">
              Create client — coming soon
            </div>
          )}
        </div>
      </div>

      {/* Client list */}
      <ul className="max-h-[180px] overflow-y-auto divide-y divide-white/5">
        {clients.map((client) => {
          const isActive = client.client_id === activeClientId;
          const statusClass = STATUS_COLORS[client.status] ?? STATUS_COLORS["Active Search"];

          return (
            <li key={client.client_id}>
              <button
                onClick={() => onSelect(client)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${
                  isActive
                    ? "bg-emerald-500/10 border-l-2 border-l-emerald-500"
                    : "hover:bg-slate-700/40 border-l-2 border-l-transparent"
                }`}
              >
                <div className="min-w-0">
                  <p className={`text-xs font-medium truncate ${isActive ? "text-white" : "text-slate-300"}`}>
                    {client.name}
                  </p>
                  {client.neighborhoods.length > 0 && (
                    <p className="text-xs text-slate-600 truncate mt-0.5">
                      {client.neighborhoods.slice(0, 2).join(", ")}
                    </p>
                  )}
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded-full border flex-shrink-0 ml-2 ${statusClass}`}>
                  {client.status.replace("Active Search", "Active").replace("Follow-up", "Follow-up")}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
