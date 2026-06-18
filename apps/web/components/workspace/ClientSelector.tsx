"use client";

import { useState } from "react";
import { ClientProfile } from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
  "Active Search": "bg-emerald-50 text-emerald-700 border-emerald-200",
  Shortlisted:    "bg-blue-50 text-blue-600 border-blue-200",
  "Follow-up":    "bg-amber-50 text-amber-700 border-amber-200",
  Closed:         "bg-gray-100 text-gray-500 border-gray-200",
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
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <p className="text-xs text-gray-400 text-center py-2">Loading clients...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Clients</p>
        <div className="relative">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-md px-2 py-1 transition-colors"
          >
            <span className="text-sm leading-none">+</span>
            <span>New</span>
          </button>
          {showTooltip && (
            <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 whitespace-nowrap">
              Create client — coming soon
            </div>
          )}
        </div>
      </div>

      {/* Client list */}
      <ul className="max-h-[160px] overflow-y-auto divide-y divide-gray-100">
        {clients.map((client) => {
          const isActive = client.client_id === activeClientId;
          const statusClass = STATUS_STYLES[client.status] ?? STATUS_STYLES["Active Search"];

          return (
            <li key={client.client_id}>
              <button
                onClick={() => onSelect(client)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                  isActive
                    ? "bg-blue-50 border-l-2 border-l-blue-500"
                    : "hover:bg-gray-50 border-l-2 border-l-transparent"
                }`}
              >
                <div className="min-w-0">
                  <p className={`text-xs font-medium truncate ${isActive ? "text-blue-700" : "text-gray-700"}`}>
                    {client.name}
                  </p>
                  {client.neighborhoods.length > 0 && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {client.neighborhoods.slice(0, 2).join(", ")}
                    </p>
                  )}
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded-full border flex-shrink-0 ml-2 ${statusClass}`}>
                  {client.status.replace("Active Search", "Active")}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
