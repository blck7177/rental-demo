"use client";

import { useEffect, useRef } from "react";

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
    <div className="flex flex-col flex-1 min-h-0 bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-200 flex-shrink-0 flex items-center gap-2 bg-gray-50">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Agent</p>
        <span className="ml-auto text-xs text-gray-400">{clientName ?? "—"}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <p className="text-gray-400 text-sm mb-4">向 Agent 发出指令，驱动工作台更新</p>
            <div className="space-y-2">
              {quickActions.map((qa) => (
                <button
                  key={qa}
                  onClick={() => onSend(qa)}
                  className="block w-full text-left text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg transition-all"
                >
                  {qa}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800 border border-gray-200"
              }`}
            >
              {msg.role === "agent" && (
                <p className="text-xs text-gray-400 mb-1 font-medium">Agent</p>
              )}
              <p className="whitespace-pre-wrap">{msg.text}</p>
              {msg.action && (
                <p className="text-xs text-blue-500 mt-1.5 font-medium">[{msg.action}]</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="block w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                <span className="block w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                <span className="block w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick action chips — show when no messages or as always-visible strip */}
      {messages.length > 0 && (
        <div className="flex-shrink-0 px-3 pb-1 flex gap-1.5 overflow-x-auto">
          {quickActions.slice(0, 3).map((qa) => (
            <button
              key={qa}
              onClick={() => onSend(qa)}
              className="flex-shrink-0 text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-700 px-2.5 py-1 rounded-full transition-colors"
            >
              {qa.slice(0, 18)}…
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-200 px-3 py-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="指令... (Enter 发送，Shift+Enter 换行)"
            rows={2}
            disabled={isLoading}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 resize-none disabled:opacity-50 transition-colors"
          />
          <button
            onClick={() => { if (inputValue.trim() && !isLoading) onSend(inputValue.trim()); }}
            disabled={isLoading || !inputValue.trim()}
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 pl-1">
          支持中英文 · NL 搜索 · 分析指令 · 消息生成
        </p>
      </div>
    </div>
  );
}
