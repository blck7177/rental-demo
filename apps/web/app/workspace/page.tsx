"use client";

import { useReducer, useCallback, useEffect } from "react";
import {
  nlQuery,
  fitAnalysis,
  compareListings,
  postResearch,
  notifyWecom,
  agentAction,
  recordSentMessage,
  getSentHistory,
  getClients,
} from "@/lib/api";
import {
  workspaceReducer,
  initialWorkspaceState,
  FitResult,
  ResearchResult,
  CompareResult,
  MessageResult,
} from "@/lib/workspaceReducer";
import ClientPanel from "@/components/workspace/ClientPanel";
import ClientSelector from "@/components/workspace/ClientSelector";
import AgentConsole from "@/components/workspace/AgentConsole";
import DisplayPanel, { DisplayTab } from "@/components/workspace/DisplayPanel";

// ---------- intent fallback ----------
function detectIntent(text: string): "search" | "analyze" | "compare" | "research" | "message" {
  const lower = text.toLowerCase();
  if (/对比|比较|compare|vs\b/.test(lower)) return "compare";
  if (/研究|楼宇|building|review|reputation/.test(lower)) return "research";
  if (/分析|fit|score|适合|匹配/.test(lower)) return "analyze";
  if (/消息|推送|微信|wechat|wecom|message|draft|发送/.test(lower)) return "message";
  return "search";
}

export default function WorkspacePage() {
  const [state, dispatch] = useReducer(workspaceReducer, initialWorkspaceState);

  const {
    clients, activeClient,
    chatMessages, inputValue, isAgentLoading,
    activeTab, loadingTab,
    listings, selectedIds, parsedSummary,
    fitResult, researchResult, compareResult, messageResult,
    sentHistory,
  } = state;

  // ---- load clients on mount ----
  useEffect(() => {
    getClients()
      .then(({ clients: loaded }) => {
        dispatch({ type: "SET_CLIENTS", clients: loaded });
        if (loaded.length > 0) {
          dispatch({ type: "SELECT_CLIENT", client: loaded[0] });
        }
      })
      .catch(() => {/* backend unavailable — keep null state */});
  }, []);

  // ---------- action handlers ----------
  const handleSearch = useCallback(async (query: string) => {
    dispatch({ type: "SET_ACTIVE_TAB", tab: "listings" });
    dispatch({ type: "SET_LOADING_TAB", tab: "listings" });

    try {
      const data = await nlQuery(query);
      dispatch({ type: "SET_LISTINGS", listings: data.results, parsedSummary: data.parsed?.parsed_summary });
      const count = data.results.length;
      const name = activeClient?.name ?? "客户";
      dispatch({
        type: "ADD_MESSAGE",
        message: {
          role: "agent",
          text: `已为 ${name} 搜索完成。共找到 ${count} 个房源，按匹配度排序。\n\n${data.parsed?.parsed_summary ?? ""}`,
          action: "run_search",
        },
      });
    } catch {
      dispatch({ type: "ADD_MESSAGE", message: { role: "agent", text: "搜索失败，请确认后端服务正在运行（port 8000）。" } });
    } finally {
      dispatch({ type: "SET_LOADING_TAB", tab: null });
    }
  }, [activeClient]);

  const handleAnalyze = useCallback(async (listingId: string) => {
    const listing = listings.find((l) => l.listing_id === listingId);
    const name = listing?._enrichment?.building_name ?? listing?.address?.split(",")[0] ?? listingId;

    dispatch({ type: "SET_ACTIVE_TAB", tab: "fit" });
    dispatch({ type: "SET_LOADING_TAB", tab: "fit" });

    try {
      const result = await fitAnalysis(listingId);
      dispatch({ type: "SET_FIT_RESULT", result: { ...result, listing_name: name } });
      dispatch({
        type: "ADD_MESSAGE",
        message: {
          role: "agent",
          text: `${name} 的 Fit Score：${result.fit_score}/100（${result.fit_label}）\n\n${result.verdict}`,
          action: "analyze_fit",
        },
      });
    } catch {
      dispatch({ type: "ADD_MESSAGE", message: { role: "agent", text: `分析 ${name} 时出错，请检查后端服务。` } });
    } finally {
      dispatch({ type: "SET_LOADING_TAB", tab: null });
    }
  }, [listings]);

  const handleCompare = useCallback(async (ids: string[]) => {
    if (ids.length < 2) {
      dispatch({ type: "ADD_MESSAGE", message: { role: "agent", text: "对比需要至少选择 2 个房源。在 Listings tab 中点击行选择。" } });
      return;
    }

    dispatch({ type: "SET_ACTIVE_TAB", tab: "compare" });
    dispatch({ type: "SET_LOADING_TAB", tab: "compare" });

    try {
      const result = await compareListings(ids);
      dispatch({ type: "SET_COMPARE_RESULT", result: result as unknown as CompareResult });
      const bestOverall = result.verdicts?.best_overall ?? "未确定";
      dispatch({
        type: "ADD_MESSAGE",
        message: {
          role: "agent",
          text: `对比完成！综合最优：${bestOverall}\n\n${result.bottom_line}`,
          action: "compare_listings",
        },
      });
    } catch {
      dispatch({ type: "ADD_MESSAGE", message: { role: "agent", text: "对比分析失败，请检查后端服务。" } });
    } finally {
      dispatch({ type: "SET_LOADING_TAB", tab: null });
    }
  }, []);

  const handleResearch = useCallback(async (listingId: string) => {
    const listing = listings.find((l) => l.listing_id === listingId);
    const name = listing?._enrichment?.building_name ?? listing?.address?.split(",")[0] ?? listingId;

    dispatch({ type: "SET_ACTIVE_TAB", tab: "research" });
    dispatch({ type: "SET_LOADING_TAB", tab: "research" });

    try {
      const result = await postResearch(listingId);
      dispatch({ type: "SET_RESEARCH_RESULT", result: result as ResearchResult });
      const signal = result.overall_signal.replace(/_/g, " ");
      const riskCount = result.risk_flags.length;
      dispatch({
        type: "ADD_MESSAGE",
        message: {
          role: "agent",
          text: `${name} 楼宇研究完成：整体评价 ${signal}${riskCount > 0 ? `，有 ${riskCount} 个风险提示` : "，无明显风险"}。`,
          action: "research_building",
        },
      });
    } catch {
      dispatch({ type: "ADD_MESSAGE", message: { role: "agent", text: `研究 ${name} 失败，请检查后端服务。` } });
    } finally {
      dispatch({ type: "SET_LOADING_TAB", tab: null });
    }
  }, [listings]);

  const handleDraftMessage = useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      dispatch({ type: "ADD_MESSAGE", message: { role: "agent", text: "请先选择至少 1 个房源（点击房源行），再生成消息。" } });
      return;
    }

    const clientName = activeClient?.name ?? "客户";
    const clientId = activeClient?.client_id ?? "cli_emily_chen_demo";

    dispatch({ type: "SET_ACTIVE_TAB", tab: "message" });
    dispatch({ type: "SET_LOADING_TAB", tab: "message" });

    try {
      const result = await notifyWecom(ids, clientName, false);
      dispatch({ type: "SET_MESSAGE_RESULT", result: result as MessageResult });
      try {
        await recordSentMessage(clientId, ids, result.message_preview, false);
        const historyData = await getSentHistory(clientId);
        dispatch({ type: "SET_SENT_HISTORY", history: historyData.sent_history });
      } catch {/* non-critical */}
      dispatch({
        type: "ADD_MESSAGE",
        message: {
          role: "agent",
          text: `消息草稿已生成，包含 ${result.listing_count} 个房源。\n在 Message tab 中查看预览，可复制后发送给 ${clientName}。`,
          action: "draft_message",
        },
      });
    } catch {
      dispatch({ type: "ADD_MESSAGE", message: { role: "agent", text: "消息生成失败，请检查后端服务。" } });
    } finally {
      dispatch({ type: "SET_LOADING_TAB", tab: null });
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
    dispatch({ type: "ADD_MESSAGE", message: { role: "agent", text: result.agent_reply, action: result.action } });

    const update = result.ui_update;
    if (!update) return;

    if (update.tab) dispatch({ type: "SET_ACTIVE_TAB", tab: update.tab as DisplayTab });
    if (update.listings) {
      dispatch({ type: "SET_LISTINGS", listings: update.listings, parsedSummary: update.parsed_summary });
    }
    if (update.fit_result) dispatch({ type: "SET_FIT_RESULT", result: update.fit_result as FitResult });
    if (update.research_result) dispatch({ type: "SET_RESEARCH_RESULT", result: update.research_result as ResearchResult });
    if (update.compare_result) dispatch({ type: "SET_COMPARE_RESULT", result: update.compare_result as CompareResult });
    if (update.message_result) dispatch({ type: "SET_MESSAGE_RESULT", result: update.message_result as MessageResult });
  }, [selectedIds, listings, activeClient]);

  // ---------- main send handler ----------
  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || isAgentLoading) return;
    dispatch({ type: "SET_INPUT", value: "" });
    dispatch({ type: "SET_AGENT_LOADING", loading: true });
    dispatch({ type: "ADD_MESSAGE", message: { role: "user", text } });

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
            else dispatch({ type: "ADD_MESSAGE", message: { role: "agent", text: "请先搜索并选择一个房源，再进行楼宇研究。" } });
            break;
          }
          case "analyze": {
            const targetId = selectedIds.size > 0
              ? Array.from(selectedIds)[0]
              : listings[0]?.listing_id;
            if (targetId) await handleAnalyze(targetId);
            else dispatch({ type: "ADD_MESSAGE", message: { role: "agent", text: "请先搜索并选择一个房源，再进行 Fit 分析。" } });
            break;
          }
          case "message": {
            const ids = selectedIds.size > 0
              ? Array.from(selectedIds)
              : listings.slice(0, 3).map((l) => l.listing_id);
            await handleDraftMessage(ids);
            break;
          }
        }
      } catch {
        dispatch({ type: "ADD_MESSAGE", message: { role: "agent", text: "操作失败，请确认后端服务正在运行（port 8000）。" } });
      }
    } finally {
      dispatch({ type: "SET_AGENT_LOADING", loading: false });
    }
  }, [
    isAgentLoading, selectedIds, listings,
    handleAgentAction, handleSearch, handleAnalyze, handleCompare,
    handleResearch, handleDraftMessage,
  ]);

  const totalLoading = isAgentLoading || loadingTab !== null;

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] bg-gray-50">
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-2 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
            Rental Advisory Workspace
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span className="text-xs text-gray-500">{activeClient?.name ?? "—"}</span>
        </div>
        <div className="flex items-center gap-3">
          {totalLoading && (
            <span className="flex items-center gap-1.5 text-xs text-blue-500">
              <span className="block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Processing...
            </span>
          )}
          <span className="text-xs text-gray-400">
            {listings.length > 0 ? `${listings.length} listings loaded` : "13 listings · LIC Studio"}
          </span>
          <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full border border-gray-200 font-medium">
            Demo
          </span>
        </div>
      </div>

      {/* Three-column workspace */}
      <div className="flex-1 overflow-hidden grid grid-cols-[220px_1fr_1.3fr] xl:grid-cols-[240px_1fr_1.5fr] gap-3 p-3 min-h-0">

        {/* LEFT: Client Selector + Client Context Panel */}
        <div className="flex flex-col gap-3 overflow-y-auto min-h-0">
          <ClientSelector
            clients={clients}
            activeClientId={activeClient?.client_id ?? ""}
            onSelect={(client) => dispatch({ type: "SELECT_CLIENT", client })}
          />
          <ClientPanel client={activeClient} />
        </div>

        {/* CENTER: Agent Console only */}
        <div className="flex flex-col min-h-0">
          <AgentConsole
            messages={chatMessages}
            isLoading={isAgentLoading}
            onSend={handleSend}
            inputValue={inputValue}
            onInputChange={(val) => dispatch({ type: "SET_INPUT", value: val })}
            clientName={activeClient?.name}
          />
        </div>

        {/* RIGHT: Display Panel */}
        <div className="min-h-0">
          <DisplayPanel
            activeTab={activeTab}
            onTabChange={(tab) => dispatch({ type: "SET_ACTIVE_TAB", tab })}
            listings={listings}
            selectedIds={selectedIds}
            onSelect={(id) => dispatch({ type: "TOGGLE_SELECT", id })}
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
            activeClient={activeClient}
          />
        </div>
      </div>
    </div>
  );
}
