"use client";

import { ClientProfile, Listing } from "@/lib/api";
import ListingsTab from "./tabs/ListingsTab";
import ShortlistTab from "./tabs/ShortlistTab";
import FitTab from "./tabs/FitTab";
import ResearchTab from "./tabs/ResearchTab";
import CompareTab from "./tabs/CompareTab";
import MessageTab from "./tabs/MessageTab";
import ClientProfileTab from "./tabs/ClientProfileTab";
import type { SentHistoryEntry } from "./tabs/MessageTab";

export type DisplayTab = "listings" | "shortlist" | "compare" | "research" | "message" | "profile" | "fit";

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
  activeClient?: ClientProfile | null;
}

const TABS: { id: DisplayTab; label: string }[] = [
  { id: "listings",  label: "Listings"  },
  { id: "shortlist", label: "Shortlist" },
  { id: "compare",   label: "Compare"   },
  { id: "research",  label: "Research"  },
  { id: "message",   label: "Message"   },
  { id: "profile",   label: "Profile"   },
  { id: "fit",       label: "Fit"       },
];

export default function DisplayPanel({
  activeTab, onTabChange,
  listings, selectedIds, onSelect, onAnalyze, onResearch,
  fitResult, researchResult, compareResult, messageResult,
  parsedSummary, isLoading, loadingTab, sentHistory,
  activeClient,
}: Props) {
  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Tab bar */}
      <div className="flex-shrink-0 flex items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-gray-50 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          const isTabLoading = loadingTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-white text-gray-900 border border-gray-200"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white"
              }`}
            >
              <span>{tab.label}</span>
              {isTabLoading && (
                <span className="block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              )}
              {tab.id === "listings" && listings.length > 0 && (
                <span className="bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {listings.length}
                </span>
              )}
              {tab.id === "listings" && selectedIds.size > 0 && (
                <span className="bg-blue-50 text-blue-600 text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {selectedIds.size}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content — no animation, simple conditional render */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto">
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
          {activeTab === "shortlist" && (
            <ShortlistTab
              clientId={activeClient?.client_id}
              listings={listings}
              onResearch={onResearch}
              onSwitchToCompare={() => onTabChange("compare")}
              onToggleSelect={onSelect}
              selectedIds={selectedIds}
              isLoading={loadingTab === "shortlist"}
            />
          )}
          {activeTab === "compare" && (
            <CompareTab result={compareResult} isLoading={loadingTab === "compare"} />
          )}
          {activeTab === "research" && (
            <ResearchTab result={researchResult} isLoading={loadingTab === "research"} />
          )}
          {activeTab === "message" && (
            <MessageTab result={messageResult} isLoading={loadingTab === "message"} sentHistory={sentHistory} />
          )}
          {activeTab === "profile" && (
            <ClientProfileTab client={activeClient ?? null} />
          )}
          {activeTab === "fit" && (
            <FitTab result={fitResult} isLoading={loadingTab === "fit"} />
          )}
        </div>
      </div>
    </div>
  );
}
