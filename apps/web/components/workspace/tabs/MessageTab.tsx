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
      <div className="p-6 space-y-4">
        <div className="h-16 bg-slate-800/60 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-800/60 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-8">
        <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center mb-4">
          <span className="text-2xl">💬</span>
        </div>
        <p className="text-slate-400 text-sm font-medium mb-2">暂无消息草稿</p>
        <p className="text-slate-600 text-xs">
          选中 2-3 个房源后，在 Agent Console 输入<br />
          "生成微信推送消息"
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${result.sent ? "bg-emerald-400" : "bg-slate-500"}`} />
          <span className="text-xs text-slate-400">
            {result.sent ? "已发送" : "草稿 · 未发送"}
          </span>
          <span className="text-xs text-slate-600">· {result.listing_count} 个房源</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="text-xs bg-slate-700 hover:bg-slate-600 border border-white/10 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            {copied ? "已复制 ✓" : "复制消息"}
          </button>
        </div>
      </div>

      {/* Message preview */}
      <div className="bg-slate-800/60 rounded-xl border border-white/10 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-slate-700/30">
          <span className="text-emerald-400 text-sm">💬</span>
          <p className="text-xs font-semibold text-slate-400">WeChat / WeCom 消息预览</p>
        </div>
        <div className="p-4">
          <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
            {result.message_preview}
          </pre>
        </div>
      </div>

      {/* Error */}
      {result.send_error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <p className="text-xs text-red-400 font-medium mb-1">发送错误</p>
          <p className="text-xs text-red-300">{result.send_error}</p>
        </div>
      )}

      {/* Send status */}
      <div className="bg-slate-800/60 border border-white/10 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">发送状态</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Client", value: "Emily Chen", sub: "Recipient" },
            { label: "Channel", value: "WeChat", sub: "Platform" },
            { label: "Status", value: result.sent ? "Sent" : "Draft", sub: result.sent ? "Delivered" : "Ready to send" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900/60 rounded-lg p-2.5">
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className="text-sm font-medium text-white">{s.value}</p>
              <p className="text-xs text-slate-600 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sent history */}
      {sentHistory.length > 0 && (
        <div className="bg-slate-800/60 border border-white/10 rounded-xl overflow-hidden">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 border-b border-white/5">
            发送历史 ({sentHistory.length})
          </p>
          <div className="divide-y divide-white/5">
            {sentHistory.slice(0, 5).map((entry) => (
              <div key={entry.sent_id} className="px-4 py-2.5 flex items-start gap-3">
                <span className={`mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full ${entry.sent ? "bg-emerald-400" : "bg-slate-600"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-400 truncate">{entry.message_preview.slice(0, 60)}...</p>
                  <p className="text-xs text-slate-600 mt-0.5">
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
