import { ClientProfile, Listing, SentHistoryEntry } from "@/lib/api";
import { DisplayTab } from "@/components/workspace/DisplayPanel";
import { ChatMessage } from "@/components/workspace/AgentConsole";

// ---------- result sub-types ----------

export interface FitResult {
  fit_score: number;
  fit_label: string;
  why_it_matches: string[];
  tradeoffs: string[];
  verdict: string;
  score_breakdown: Record<string, number>;
  listing_name?: string;
}

export interface ResearchResult {
  building_name: string;
  overall_signal: string;
  rating_snapshot: { google_rating?: number; review_count?: number };
  positive_themes: string[];
  negative_themes: string[];
  risk_flags: { type: string; severity: string; evidence: string }[];
  research_notes: string;
  neighborhood_notes?: string;
}

export interface CompareResult {
  summary: string;
  verdicts: Record<string, string>;
  verdict_explanations: Record<string, string>;
  comparison_rows: { category: string; values: Record<string, string>; winner?: string }[];
  bottom_line: string;
  listings: Record<string, unknown>[];
}

export interface MessageResult {
  message_preview: string;
  wecom_payload: unknown;
  sent: boolean;
  send_error?: string;
  listing_count: number;
}

// ---------- state ----------

export interface WorkspaceState {
  clients: ClientProfile[];
  activeClient: ClientProfile | null;
  chatMessages: ChatMessage[];
  inputValue: string;
  isAgentLoading: boolean;
  activeTab: DisplayTab;
  loadingTab: DisplayTab | null;
  listings: Listing[];
  selectedIds: Set<string>;
  parsedSummary: string | undefined;
  fitResult: FitResult | null;
  researchResult: ResearchResult | null;
  compareResult: CompareResult | null;
  messageResult: MessageResult | null;
  sentHistory: SentHistoryEntry[];
}

// ---------- actions ----------

export type WorkspaceAction =
  | { type: "SET_CLIENTS"; clients: ClientProfile[] }
  | { type: "SELECT_CLIENT"; client: ClientProfile }
  | { type: "ADD_MESSAGE"; message: Omit<ChatMessage, "id" | "timestamp"> }
  | { type: "SET_INPUT"; value: string }
  | { type: "SET_AGENT_LOADING"; loading: boolean }
  | { type: "SET_ACTIVE_TAB"; tab: DisplayTab }
  | { type: "SET_LOADING_TAB"; tab: DisplayTab | null }
  | { type: "SET_LISTINGS"; listings: Listing[]; parsedSummary?: string }
  | { type: "TOGGLE_SELECT"; id: string }
  | { type: "SET_FIT_RESULT"; result: FitResult }
  | { type: "SET_RESEARCH_RESULT"; result: ResearchResult }
  | { type: "SET_COMPARE_RESULT"; result: CompareResult }
  | { type: "SET_MESSAGE_RESULT"; result: MessageResult }
  | { type: "SET_SENT_HISTORY"; history: SentHistoryEntry[] };

// ---------- helpers ----------

let _msgCounter = 0;
function genId(): string {
  return `msg_${Date.now()}_${++_msgCounter}`;
}

export function makeWelcomeMessage(name: string): ChatMessage {
  return {
    id: "welcome",
    role: "agent",
    text: `你好！我是 ${name} 的专属租房助手。\n\n你可以用自然语言告诉我：\n• 搜索符合条件的房源\n• 分析某个房源的匹配度\n• 对比已选的房源\n• 研究楼宇口碑\n• 生成微信推送消息\n\n试试右侧的快捷指令，或者直接输入你的需求。`,
    timestamp: new Date(),
  };
}

// ---------- initial state ----------

export const initialWorkspaceState: WorkspaceState = {
  clients: [],
  activeClient: null,
  chatMessages: [makeWelcomeMessage("客户")],
  inputValue: "",
  isAgentLoading: false,
  activeTab: "listings",
  loadingTab: null,
  listings: [],
  selectedIds: new Set(),
  parsedSummary: undefined,
  fitResult: null,
  researchResult: null,
  compareResult: null,
  messageResult: null,
  sentHistory: [],
};

// ---------- reducer ----------

export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case "SET_CLIENTS":
      return { ...state, clients: action.clients };

    case "SELECT_CLIENT": {
      return {
        ...state,
        activeClient: action.client,
        listings: [],
        selectedIds: new Set(),
        fitResult: null,
        researchResult: null,
        compareResult: null,
        messageResult: null,
        sentHistory: [],
        parsedSummary: undefined,
        activeTab: "listings",
        chatMessages: [makeWelcomeMessage(action.client.name)],
        inputValue: "",
      };
    }

    case "ADD_MESSAGE":
      return {
        ...state,
        chatMessages: [
          ...state.chatMessages,
          { ...action.message, id: genId(), timestamp: new Date() },
        ],
      };

    case "SET_INPUT":
      return { ...state, inputValue: action.value };

    case "SET_AGENT_LOADING":
      return { ...state, isAgentLoading: action.loading };

    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.tab };

    case "SET_LOADING_TAB":
      return { ...state, loadingTab: action.tab };

    case "SET_LISTINGS":
      return {
        ...state,
        listings: action.listings,
        parsedSummary: action.parsedSummary,
        selectedIds: new Set(),
      };

    case "TOGGLE_SELECT": {
      const next = new Set(state.selectedIds);
      if (next.has(action.id)) {
        next.delete(action.id);
      } else if (next.size < 3) {
        next.add(action.id);
      }
      return { ...state, selectedIds: next };
    }

    case "SET_FIT_RESULT":
      return { ...state, fitResult: action.result };

    case "SET_RESEARCH_RESULT":
      return { ...state, researchResult: action.result };

    case "SET_COMPARE_RESULT":
      return { ...state, compareResult: action.result };

    case "SET_MESSAGE_RESULT":
      return { ...state, messageResult: action.result };

    case "SET_SENT_HISTORY":
      return { ...state, sentHistory: action.history };

    default:
      return state;
  }
}
