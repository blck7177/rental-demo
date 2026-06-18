"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Listing,
  ClientProfile,
  nlQuery,
  fitAnalysis,
  compareListings,
  postResearch,
  notifyWecom,
  agentAction,
  recordSentMessage,
  getSentHistory,
  getClients,
  SentHistoryEntry,
} from "@/lib/api";
import ClientPanel from "@/components/workspace/ClientPanel";
import ClientSelector from "@/components/workspace/ClientSelector";
import WorkflowProgress, { WorkflowStepId } from "@/components/workspace/WorkflowProgress";
import AgentConsole, { ChatMessage } from "@/components/workspace/AgentConsole";
import DisplayPanel, { DisplayTab } from "@/components/workspace/DisplayPanel";
import PipelinePanel from "@/components/workspace/PipelinePanel";

// ---------- types ----------
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

// ---------- intent detection helpers ----------
function detectIntent(text: string): "search" | "analyze" | "compare" | "research" | "message" | "unknown" {
  const lower = text.toLowerCase();
  if (/对比|比较|compare|vs\b/.test(lower)) return "compare";
  if (/研究|楼宇|building|review|reputation/.test(lower)) return "research";
  if (/分析|fit|score|适合|匹配/.test(lower)) return "analyze";
  if (/消息|推送|微信|wechat|wecom|message|draft|发送/.test(lower)) return "message";
  if (/找|搜|search|show|under|studio|budget|recommend/.test(lower)) return "search";
  return "search";
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function buildWelcomeMessage(name: string): ChatMessage {
  return {
    id: "welcome",
    role: "agent",
    text: `你好！我是 ${name} 的专属租房助手。\n\n你可以用自然语言告诉我：\n• 搜索符合条件的房源\n• 分析某个房源的匹配度\n• 对比已选的房源\n• 研究楼宇口碑\n• 生成微信推送消息\n\n试试右侧的快捷指令，或者直接输入你的需求。`,
    timestamp: new Date(),
  };
}

export default function WorkspacePage() {
  // ---- client state ----
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [activeClient, setActiveClient] = useState<ClientProfile | null>(null);

  // ---- chat state ----
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([buildWelcomeMessage("客户")]);
  const [inputValue, setInputValue] = useState("");
  const [isAgentLoading, setIsAgentLoading] = useState(false);

  // ---- workspace state ----
  const [activeTab, setActiveTab] = useState<DisplayTab>("listings");
  const [loadingTab, setLoadingTab] = useState<DisplayTab | null>(null);
  const [currentTask, setCurrentTask] = useState("准备就绪 — 等待指令");
  const [activeStep, setActiveStep] = useState<WorkflowStepId>("intake");
  const [completedSteps, setCompletedSteps] = useState<WorkflowStepId[]>(["intake"]);

  // ---- result state ----
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [parsedSummary, setParsedSummary] = useState<string | undefined>();
  const [fitResult, setFitResult] = useState<FitResult | null>(null);
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [messageResult, setMessageResult] = useState<MessageResult | null>(null);
  const [sentHistory, setSentHistory] = useState<SentHistoryEntry[]>([]);

  // ---- load clients on mount ----
  useEffect(() => {
    getClients()
      .then(({ clients: loaded }) => {
        setClients(loaded);
        if (loaded.length > 0) {
          setActiveClient(loaded[0]);
          setChatMessages([buildWelcomeMessage(loaded[0].name)]);
        }
      })
      .catch(() => {
        // backend unavailable — keep null, UI shows skeleton
      });
  }, []);

  // ---------- helpers ----------
  function addMessage(msg: Omit<ChatMessage, "id" | "timestamp">) {
    setChatMessages((prev) => [
      ...prev,
      { ...msg, id: genId(), timestamp: new Date() },
    ]);
  }

  function completeStep(step: WorkflowStepId) {
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
      return next;
    });
  }

  // ---------- client switching ----------
  function handleSelectClient(client: ClientProfile) {
    setActiveClient(client);
    setListings([]);
    setSelectedIds(new Set());
    setFitResult(null);
    setResearchResult(null);
    setCompareResult(null);
    setMessageResult(null);
    setSentHistory([]);
    setParsedSummary(undefined);
    setCurrentTask("准备就绪 — 等待指令");
    setActiveStep("intake");
    setCompletedSteps(["intake"]);
    setActiveTab("listings");
    setChatMessages([buildWelcomeMessage(client.name)]);
  }

  // ---------- action handlers ----------
  const handleSearch = useCallback(async (query: string) => {
    setCurrentTask(`搜索：${query.slice(0, 60)}...`);
    setActiveStep("search");
    setLoadingTab("listings");
    setActiveTab("listings");
    setParsedSummary(undefined);

    try {
      const data = await nlQuery(query);
      setListings(data.results);
      setParsedSummary(data.parsed?.parsed_summary);
      completeStep("search");

      const count = data.results.length;
      const name = activeClient?.name ?? "客户";
      addMessage({
        role: "agent",
        text: `已为 ${name} 搜索完成。共找到 ${count} 个房源，按匹配度排序。\n\n${data.parsed?.parsed_summary ?? ""}`,
        action: "run_search",
      });
    } catch {
      addMessage({ role: "agent", text: "搜索失败，请确认后端服务正在运行（port 8000）。" });
    } finally {
      setLoadingTab(null);
      setCurrentTask("搜索完成 — 查看右侧结果");
    }
  }, [activeClient]);

  const handleAnalyze = useCallback(async (listingId: string) => {
    const listing = listings.find((l) => l.listing_id === listingId);
    const name = listing?._enrichment?.building_name ?? listing?.address?.split(",")[0] ?? listingId;

    setCurrentTask(`分析 ${name} 的匹配度...`);
    setActiveStep("analyze");
    setLoadingTab("fit");
    setActiveTab("fit");

    try {
      const result = await fitAnalysis(listingId);
      setFitResult({ ...result, listing_name: name });
      completeStep("analyze");
      addMessage({
        role: "agent",
        text: `${name} 的 Fit Score：${result.fit_score}/100（${result.fit_label}）\n\n${result.verdict}`,
        action: "analyze_fit",
      });
    } catch {
      addMessage({ role: "agent", text: `分析 ${name} 时出错，请检查后端服务。` });
    } finally {
      setLoadingTab(null);
      setCurrentTask(`Fit 分析完成 — ${name}`);
    }
  }, [listings]);

  const handleCompare = useCallback(async (ids: string[]) => {
    if (ids.length < 2) {
      addMessage({ role: "agent", text: "对比需要至少选择 2 个房源。在 Listings tab 中点击 + 按钮选择。" });
      return;
    }

    setCurrentTask(`对比分析 ${ids.length} 个房源...`);
    setActiveStep("compare");
    setLoadingTab("compare");
    setActiveTab("compare");

    try {
      const result = await compareListings(ids);
      setCompareResult(result as unknown as CompareResult);
      completeStep("compare");
      const bestOverall = result.verdicts?.best_overall ?? "未确定";
      addMessage({
        role: "agent",
        text: `对比完成！综合最优：${bestOverall}\n\n${result.bottom_line}`,
        action: "compare_listings",
      });
    } catch {
      addMessage({ role: "agent", text: "对比分析失败，请检查后端服务。" });
    } finally {
      setLoadingTab(null);
      setCurrentTask("对比分析完成");
    }
  }, []);

  const handleResearch = useCallback(async (listingId: string) => {
    const listing = listings.find((l) => l.listing_id === listingId);
    const name = listing?._enrichment?.building_name ?? listing?.address?.split(",")[0] ?? listingId;

    setCurrentTask(`研究 ${name} 的楼宇口碑...`);
    setActiveStep("research");
    setLoadingTab("research");
    setActiveTab("research");

    try {
      const result = await postResearch(listingId);
      setResearchResult(result);
      completeStep("research");
      const signal = result.overall_signal.replace(/_/g, " ");
      const riskCount = result.risk_flags.length;
      addMessage({
        role: "agent",
        text: `${name} 楼宇研究完成：整体评价 ${signal}${riskCount > 0 ? `，有 ${riskCount} 个风险提示` : "，无明显风险"}。`,
        action: "research_building",
      });
    } catch {
      addMessage({ role: "agent", text: `研究 ${name} 失败，请检查后端服务。` });
    } finally {
      setLoadingTab(null);
      setCurrentTask(`楼宇研究完成 — ${name}`);
    }
  }, [listings]);

  const handleDraftMessage = useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      addMessage({ role: "agent", text: "请先选择至少 1 个房源（点击房源卡片上的 + 按钮），再生成消息。" });
      return;
    }

    const clientName = activeClient?.name ?? "客户";
    const clientId = activeClient?.client_id ?? "cli_emily_chen_demo";

    setCurrentTask(`生成 ${clientName} 的微信推送消息...`);
    setActiveStep("message");
    setLoadingTab("message");
    setActiveTab("message");

    try {
      const result = await notifyWecom(ids, clientName, false);
      setMessageResult(result);
      completeStep("message");
      try {
        await recordSentMessage(clientId, ids, result.message_preview, false);
        const historyData = await getSentHistory(clientId);
        setSentHistory(historyData.sent_history);
      } catch {
        // Non-critical: ignore if backend unavailable
      }
      addMessage({
        role: "agent",
        text: `消息草稿已生成，包含 ${result.listing_count} 个房源。\n在 Message tab 中查看预览，可复制后发送给 ${clientName}。`,
        action: "draft_message",
      });
    } catch {
      addMessage({ role: "agent", text: "消息生成失败，请检查后端服务。" });
    } finally {
      setLoadingTab(null);
      setCurrentTask("消息草稿已生成");
    }
  }, [activeClient]);

  // ---------- agent action handler ----------
  const handleAgentAction = useCallback(async (text: string) => {
    const selectedArr = Array.from(selectedIds);
    const topIds = listings.slice(0, 5).map((l) => l.listing_id);
    const targetId = selectedArr[0] ?? listings[0]?.listing_id;

    const context = {
      client_id: activeClient?.client_id ?? "cli_emily_chen_demo",
      client_name: activeClient?.name ?? "Emily Chen",
      selected_listing_ids: selectedArr,
      target_listing_id: targetId,
      top_listing_ids: topIds,
    };

    const result = await agentAction(text, context);
    addMessage({ role: "agent", text: result.agent_reply, action: result.action });

    const update = result.ui_update;
    if (!update) return;

    if (update.tab) setActiveTab(update.tab as DisplayTab);
    if (update.listings) {
      setListings(update.listings);
      setParsedSummary(update.parsed_summary);
      completeStep("search");
    }
    if (update.fit_result) {
      setFitResult(update.fit_result as FitResult);
      completeStep("analyze");
    }
    if (update.research_result) {
      setResearchResult(update.research_result as ResearchResult);
      completeStep("research");
    }
    if (update.compare_result) {
      setCompareResult(update.compare_result as CompareResult);
      completeStep("compare");
    }
    if (update.message_result) {
      setMessageResult(update.message_result as MessageResult);
      completeStep("message");
    }
  }, [selectedIds, listings, activeClient]);

  // ---------- main send handler ----------
  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || isAgentLoading) return;
    setInputValue("");
    setIsAgentLoading(true);
    addMessage({ role: "user", text });

    try {
      await handleAgentAction(text);
    } catch {
      const intent = detectIntent(text);
      try {
        switch (intent) {
          case "search":
            await handleSearch(text);
            break;
          case "compare":
            await handleCompare(Array.from(selectedIds));
            break;
          case "research": {
            const targetId = selectedIds.size > 0
              ? Array.from(selectedIds)[0]
              : listings[0]?.listing_id;
            if (targetId) await handleResearch(targetId);
            else addMessage({ role: "agent", text: "请先搜索并选择一个房源，再进行楼宇研究。" });
            break;
          }
          case "analyze": {
            const targetId = selectedIds.size > 0
              ? Array.from(selectedIds)[0]
              : listings[0]?.listing_id;
            if (targetId) await handleAnalyze(targetId);
            else addMessage({ role: "agent", text: "请先搜索并选择一个房源，再进行 Fit 分析。" });
            break;
          }
          case "message": {
            const ids = selectedIds.size > 0
              ? Array.from(selectedIds)
              : listings.slice(0, 3).map((l) => l.listing_id);
            await handleDraftMessage(ids);
            break;
          }
          default:
            await handleSearch(text);
        }
      } catch {
        addMessage({ role: "agent", text: "操作失败，请确认后端服务正在运行（port 8000）。" });
      }
    } finally {
      setIsAgentLoading(false);
    }
  }, [
    isAgentLoading, selectedIds, listings,
    handleAgentAction, handleSearch, handleAnalyze, handleCompare,
    handleResearch, handleDraftMessage,
  ]);

  const totalLoading = isAgentLoading || loadingTab !== null;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-slate-950">
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-white/5 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Rental Agent Workspace</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span className="text-xs text-slate-600">{activeClient?.name ?? "..."}</span>
        </div>
        <div className="flex items-center gap-3">
          {totalLoading && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              处理中...
            </span>
          )}
          <span className="text-xs text-slate-600">13 listings · LIC Studio</span>
        </div>
      </div>

      {/* Three-column workspace */}
      <div className="flex-1 overflow-hidden grid grid-cols-[240px_1fr_1fr] xl:grid-cols-[260px_1.1fr_1.4fr] gap-3 p-3 min-h-0">

        {/* LEFT: Client Selector + Client Context Panel */}
        <div className="flex flex-col gap-3 overflow-y-auto min-h-0">
          <ClientSelector
            clients={clients}
            activeClientId={activeClient?.client_id ?? ""}
            onSelect={handleSelectClient}
          />
          <ClientPanel client={activeClient} />
        </div>

        {/* CENTER: Workflow + Pipeline + Agent Console */}
        <div className="flex flex-col gap-3 min-h-0">
          <WorkflowProgress
            currentTask={currentTask}
            activeStep={activeStep}
            completedSteps={completedSteps}
            isLoading={totalLoading}
          />
          <PipelinePanel
            onRunComplete={(count) => {
              addMessage({
                role: "agent",
                text: `Pipeline 完成！已导入 ${count} 个新房源。可以输入搜索指令开始筛选。`,
                action: "pipeline_complete",
              });
              completeStep("search");
            }}
          />
          <AgentConsole
            messages={chatMessages}
            isLoading={isAgentLoading}
            onSend={handleSend}
            inputValue={inputValue}
            onInputChange={setInputValue}
            clientName={activeClient?.name}
          />
        </div>

        {/* RIGHT: Display Panel */}
        <div className="min-h-0">
          <DisplayPanel
            activeTab={activeTab}
            onTabChange={setActiveTab}
            listings={listings}
            selectedIds={selectedIds}
            onSelect={toggleSelect}
            onAnalyze={handleAnalyze}
            onResearch={handleResearch}
            fitResult={fitResult}
            researchResult={researchResult}
            compareResult={compareResult}
            messageResult={messageResult}
            parsedSummary={parsedSummary}
            isLoading={totalLoading}
            loadingTab={loadingTab}
            sentHistory={sentHistory}
          />
        </div>
      </div>
    </div>
  );
}
