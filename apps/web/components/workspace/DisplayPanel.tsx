"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Listing } from "@/lib/api";
import ListingsTab from "./tabs/ListingsTab";
import FitTab from "./tabs/FitTab";
import ResearchTab from "./tabs/ResearchTab";
import CompareTab from "./tabs/CompareTab";
import MessageTab, { SentHistoryEntry } from "./tabs/MessageTab";

export type DisplayTab = "listings" | "fit" | "research" | "compare" | "message";

interface FitResult {
  fit_score: number;
  fit_label: string;
  why_it_matches: string[];
  tradeoffs: string[];
  verdict: string;
  score_breakdown: Record<string, number>;
  listing_name?: string;
}

interface ResearchResult {
  building_name: string;
  overall_signal: string;
  rating_snapshot: { google_rating?: number; review_count?: number };
  positive_themes: string[];
  negative_themes: string[];
  risk_flags: { type: string; severity: string; evidence: string }[];
  research_notes: string;
  neighborhood_notes?: string;
}

interface CompareResult {
  summary: string;
  verdicts: Record<string, string>;
  verdict_explanations: Record<string, string>;
  comparison_rows: { category: string; values: Record<string, string>; winner?: string }[];
  bottom_line: string;
  listings: Record<string, unknown>[];
}

interface MessageResult {
  message_preview: string;
  wecom_payload: unknown;
  sent: boolean;
  send_error?: string;
  listing_count: number;
}

interface Props {
  activeTab: DisplayTab;
  onTabChange: (tab: DisplayTab) => void;
  listings: Listing[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onAnalyze: (id: string) => void;
  onResearch: (id: string) => void;
  fitResult: FitResult | null;
  researchResult: ResearchResult | null;
  compareResult: CompareResult | null;
  messageResult: MessageResult | null;
  parsedSummary?: string;
  isLoading: boolean;
  loadingTab: DisplayTab | null;
  sentHistory?: SentHistoryEntry[];
}

const TABS: { id: DisplayTab; label: string; icon: string }[] = [
  { id: "listings", label: "Listings", icon: "🏠" },
  { id: "fit", label: "Fit", icon: "🎯" },
  { id: "research", label: "Research", icon: "📋" },
  { id: "compare", label: "Compare", icon: "⚖️" },
  { id: "message", label: "Message", icon: "💬" },
];

export default function DisplayPanel({
  activeTab, onTabChange,
  listings, selectedIds, onSelect, onAnalyze, onResearch,
  fitResult, researchResult, compareResult, messageResult,
  parsedSummary, isLoading, loadingTab, sentHistory,
}: Props) {
  return (
    <div className="flex flex-col h-full bg-slate-800/40 rounded-xl border border-white/10 overflow-hidden">
      {/* Tab bar */}
      <div className="flex-shrink-0 flex items-center gap-0.5 px-3 py-2.5 border-b border-white/5 bg-slate-900/30">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          const isTabLoading = loadingTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-slate-700 text-white border border-white/10"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {isTabLoading && (
                <span className="block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
              {tab.id === "listings" && listings.length > 0 && (
                <span className="bg-slate-600 text-slate-300 text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">
                  {listings.length}
                </span>
              )}
              {tab.id === "listings" && selectedIds.size > 0 && (
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">
                  {selectedIds.size}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 overflow-y-auto"
          >
            {activeTab === "listings" && (
              <ListingsTab
                listings={listings}
                selectedIds={selectedIds}
                onSelect={onSelect}
                onAnalyze={onAnalyze}
                onResearch={onResearch}
                isLoading={loadingTab === "listings"}
                parsedSummary={parsedSummary}
              />
            )}
            {activeTab === "fit" && (
              <FitTab result={fitResult} isLoading={loadingTab === "fit"} />
            )}
            {activeTab === "research" && (
              <ResearchTab result={researchResult} isLoading={loadingTab === "research"} />
            )}
            {activeTab === "compare" && (
              <CompareTab result={compareResult} isLoading={loadingTab === "compare"} />
            )}
            {activeTab === "message" && (
              <MessageTab result={messageResult} isLoading={loadingTab === "message"} sentHistory={sentHistory} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
