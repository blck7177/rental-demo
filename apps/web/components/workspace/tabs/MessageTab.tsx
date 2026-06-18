"use client";

import { useState } from "react";

interface MessageResult {
  message_preview: string;
  wecom_payload: unknown;
  sent: boolean;
  send_error?: string;
  listing_count: number;
}

export interface SentHistoryEntry {
  sent_id: string;
  listing_ids: string[];
  message_preview: string;
  channel: string;
  sent: boolean;
  created_at: string;
}

interface Props {
  result: MessageResult | null;
  isLoading?: boolean;
  onCopy?: () => void;
  sentHistory?: SentHistoryEntry[];
}

export default function MessageTab({ result, isLoading, onCopy, sentHistory = [] }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.message_preview).then(() => {
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (isLoading) {
    return (
      <div className="p-5 space-y-3">
        <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-56 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-8">
        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mb-3">
          <span className="text-base text-gray-400">M</span>
        </div>
        <p className="text-gray-500 text-sm font-medium mb-1">No message draft</p>
        <p className="text-gray-400 text-xs">
          Select 2–3 listings and ask the agent:<br />
          "Draft a WeChat update for this client"
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${result.sent ? "bg-emerald-500" : "bg-gray-300"}`} />
          <span className="text-xs text-gray-500">
            {result.sent ? "Sent" : "Draft — not sent"}
          </span>
          <span className="text-xs text-gray-400">· {result.listing_count} listings</span>
        </div>
        <button
          onClick={handleCopy}
          className="text-xs bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition-colors"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>

      {/* Message preview */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold text-gray-400">WeChat / WeCom Draft</p>
        </div>
        <div className="p-4">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
            {result.message_preview}
          </pre>
        </div>
      </div>

      {/* Error */}
      {result.send_error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-xs text-red-600 font-medium mb-1">Send error</p>
          <p className="text-xs text-red-500">{result.send_error}</p>
        </div>
      )}

      {/* Send status */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Status</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Channel", value: "WeChat" },
            { label: "Listings", value: String(result.listing_count) },
            { label: "Status", value: result.sent ? "Sent" : "Draft" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg p-2.5 border border-gray-200">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className="text-sm font-medium text-gray-800">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sent history */}
      {sentHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 border-b border-gray-100">
            Send History ({sentHistory.length})
          </p>
          <div className="divide-y divide-gray-100">
            {sentHistory.slice(0, 5).map((entry) => (
              <div key={entry.sent_id} className="px-4 py-2.5 flex items-start gap-3">
                <span className={`mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full ${entry.sent ? "bg-emerald-500" : "bg-gray-300"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 truncate">{entry.message_preview.slice(0, 60)}…</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {entry.listing_ids.length} listings · {entry.sent ? "Sent" : "Draft"} · {entry.channel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
