"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: Date;
  action?: string;
}

function getQuickActions(name: string): string[] {
  return [
    `帮 ${name} 找 LIC studio，预算 3200 以下，安静优先`,
    "研究 top 1 的楼宇评价",
    "把选中的房源进行对比分析",
    "生成微信推送消息",
    "找最快通勤到 Midtown 的选项",
  ];
}

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (text: string) => void;
  inputValue: string;
  onInputChange: (val: string) => void;
  clientName?: string;
}

export default function AgentConsole({ messages, isLoading, onSend, inputValue, onInputChange, clientName }: Props) {
  const quickActions = getQuickActions(clientName ?? "客户");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isLoading) {
        onSend(inputValue.trim());
      }
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-slate-800/80 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex-shrink-0 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Agent Console</p>
        <span className="ml-auto text-xs text-slate-600">{clientName ?? "客户"}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <p className="text-slate-500 text-sm mb-4">向 Agent 发出指令，驱动工作台更新</p>
            <div className="space-y-2">
              {quickActions.map((qa) => (
                <button
                  key={qa}
                  onClick={() => onSend(qa)}
                  className="block w-full text-left text-xs bg-slate-900/60 hover:bg-slate-700/60 border border-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg transition-all"
                >
                  {qa}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-emerald-600/30 text-emerald-100 border border-emerald-500/20"
                    : "bg-slate-700/60 text-slate-200 border border-white/5"
                }`}
              >
                {msg.role === "agent" && (
                  <p className="text-xs text-slate-500 mb-1 font-medium">Agent</p>
                )}
                <p className="whitespace-pre-wrap">{msg.text}</p>
                {msg.action && (
                  <p className="text-xs text-emerald-400 mt-1.5 font-medium">[{msg.action}]</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-slate-700/60 border border-white/5 rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="block w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                <span className="block w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                <span className="block w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-white/5 px-3 py-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入指令... (Enter 发送，Shift+Enter 换行)"
            rows={2}
            disabled={isLoading}
            className="flex-1 bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none disabled:opacity-50 transition-colors"
          />
          <button
            onClick={() => { if (inputValue.trim() && !isLoading) onSend(inputValue.trim()); }}
            disabled={isLoading || !inputValue.trim()}
            className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-slate-700 mt-1.5 pl-1">
          支持中英文 · NL搜索 · 分析指令 · 消息生成
        </p>
      </div>
    </div>
  );
}
