"""Agent Action Service — translates natural language broker commands into structured actions.

Flow:
  user NL input
    → intent classification (LLM or heuristic)
    → action dispatch to existing services
    → structured response { action, agent_reply, ui_update }

Supported actions:
  update_requirements   — update client search profile
  run_search            — NL search for listings
  filter_results        — filter/re-rank existing results
  analyze_listing       — fit analysis for a listing
  compare_selected      — compare 2-3 selected listings
  research_listing      — building reputation research
  draft_message         — generate WeCom client message
  record_feedback       — log client feedback note
"""

from __future__ import annotations

import json
import os
import re
from typing import Any

from src.services.llm_client import get_llm_client
from src.services.query_service import nl_search
from src.services.fit_analysis_service import analyze_fit
from src.services.comparison_service import compare_listings
from src.services.review_research_service import research_building
from src.services.client_service import append_client_note, get_client

# ---------- constants ----------

SUPPORTED_ACTIONS = [
    "update_requirements",
    "run_search",
    "filter_results",
    "analyze_listing",
    "compare_selected",
    "research_listing",
    "draft_message",
    "record_feedback",
]

INTENT_SYSTEM = """You are an AI assistant that classifies broker commands into structured actions.

Given a broker's natural language instruction (may be Chinese or English), return ONLY valid JSON:
{
  "action": "<one of the supported actions>",
  "params": {
    "query": "<search query if action is run_search or filter_results>",
    "listing_id": "<listing_id if specific listing mentioned>",
    "note": "<note text if action is record_feedback or update_requirements>",
    "requirements": "<requirements update text if action is update_requirements>"
  },
  "reasoning": "<1 sentence explaining the classification>"
}

Supported actions and when to use them:
- run_search: user wants to find/search listings (找, 搜, show me, find, search, look for)
- filter_results: re-rank/filter existing results (重新排序, 只看, filter, sort by, re-rank)
- analyze_listing: analyze fit for a listing (分析, analyze, fit score, 适合, 匹配)
- compare_selected: compare 2-3 listings (对比, 比较, compare, vs, side by side)
- research_listing: research building reputation (研究, 楼宇, review, reputation, 口碑)
- draft_message: generate client message (消息, 微信, wechat, draft, 推送, send)
- record_feedback: record client preference/feedback (记录, 客户说, feedback, 不喜欢, noted, remember)
- update_requirements: update search criteria (更新需求, 预算改成, 改成, update, change budget)

Default to run_search if unclear.
Return ONLY the JSON object, no other text.
"""


def _demo_mode() -> bool:
    return os.getenv("DEMO_MODE", "true").lower() == "true"


# ---------- heuristic fallback classifier ----------

def _heuristic_classify(text: str) -> dict[str, Any]:
    lower = text.lower()
    params: dict[str, Any] = {}

    if re.search(r"对比|比较|compare|vs\b|side.by.side", lower):
        action = "compare_selected"
    elif re.search(r"研究|楼宇|building.*review|reputation|口碑", lower):
        action = "research_listing"
    elif re.search(r"分析|fit score|适合|匹配|analyze", lower):
        action = "analyze_listing"
    elif re.search(r"消息|推送|微信|wechat|wecom|draft.*message|生成.*消息", lower):
        action = "draft_message"
    elif re.search(r"记录|客户说|feedback|不喜欢|noted|remember", lower):
        action = "record_feedback"
        params["note"] = text
    elif re.search(r"更新需求|预算改成|改成.*预算|update.*require|change.*budget", lower):
        action = "update_requirements"
        params["requirements"] = text
    elif re.search(r"重新排序|重排|只看|filter|sort by|re.rank", lower):
        action = "filter_results"
        params["query"] = text
    else:
        action = "run_search"
        params["query"] = text

    return {"action": action, "params": params, "reasoning": "heuristic classification"}


def classify_intent(text: str) -> dict[str, Any]:
    """Classify broker command into a structured action using LLM with heuristic fallback."""
    try:
        llm = get_llm_client()
        raw = llm.complete(system=INTENT_SYSTEM, user=f'Broker command: "{text}"', max_tokens=400)
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned)
            cleaned = re.sub(r"\n?```$", "", cleaned)
        result = json.loads(cleaned)
        if result.get("action") not in SUPPORTED_ACTIONS:
            return _heuristic_classify(text)
        return result
    except Exception:
        return _heuristic_classify(text)


# ---------- action handlers ----------

def _handle_run_search(params: dict, context: dict) -> dict[str, Any]:
    query = params.get("query") or context.get("raw_text", "")
    results = nl_search(query, demo_mode=_demo_mode())
    listing_count = len(results.get("results", []))
    parsed_summary = results.get("parsed", {}).get("parsed_summary", "")
    return {
        "action": "run_search",
        "agent_reply": (
            f"已完成搜索，共找到 {listing_count} 个房源，按匹配度排序。\n\n{parsed_summary}"
            if parsed_summary
            else f"已完成搜索，共找到 {listing_count} 个房源。"
        ),
        "ui_update": {
            "tab": "listings",
            "listings": results.get("results", []),
            "parsed_summary": parsed_summary,
        },
    }


def _handle_filter_results(params: dict, context: dict) -> dict[str, Any]:
    query = params.get("query") or context.get("raw_text", "")
    results = nl_search(query, demo_mode=_demo_mode())
    listing_count = len(results.get("results", []))
    parsed_summary = results.get("parsed", {}).get("parsed_summary", "")
    return {
        "action": "filter_results",
        "agent_reply": f"已根据新条件重新过滤，当前显示 {listing_count} 个结果。",
        "ui_update": {
            "tab": "listings",
            "listings": results.get("results", []),
            "parsed_summary": parsed_summary,
        },
    }


def _handle_analyze_listing(params: dict, context: dict) -> dict[str, Any]:
    listing_id = params.get("listing_id") or context.get("target_listing_id")
    if not listing_id:
        return {
            "action": "analyze_listing",
            "agent_reply": "请指定要分析的房源 ID，或先在 Listings tab 中选择一个房源。",
            "ui_update": None,
        }
    result = analyze_fit(listing_id, context.get("profile"), demo_mode=_demo_mode())
    score = result.get("fit_score", 0)
    label = result.get("fit_label", "")
    verdict = result.get("verdict", "")
    return {
        "action": "analyze_listing",
        "agent_reply": f"Fit Score：{score}/100（{label}）\n\n{verdict}",
        "ui_update": {"tab": "fit", "fit_result": result},
    }


def _handle_compare_selected(params: dict, context: dict) -> dict[str, Any]:
    listing_ids = context.get("selected_listing_ids", [])
    if len(listing_ids) < 2:
        return {
            "action": "compare_selected",
            "agent_reply": "对比需要至少选择 2 个房源。请在 Listings tab 中点击 + 选择 2-3 个房源。",
            "ui_update": None,
        }
    result = compare_listings(listing_ids, context.get("profile"), demo_mode=_demo_mode())
    best = result.get("verdicts", {}).get("best_overall", "未确定")
    bottom_line = result.get("bottom_line", "")
    return {
        "action": "compare_selected",
        "agent_reply": f"对比完成！综合最优：{best}\n\n{bottom_line}",
        "ui_update": {"tab": "compare", "compare_result": result},
    }


def _handle_research_listing(params: dict, context: dict) -> dict[str, Any]:
    listing_id = params.get("listing_id") or context.get("target_listing_id")
    if not listing_id:
        return {
            "action": "research_listing",
            "agent_reply": "请指定要研究的房源 ID，或先选择一个房源。",
            "ui_update": None,
        }
    result = research_building(listing_id, demo_mode=_demo_mode())
    signal = result.get("overall_signal", "unknown").replace("_", " ")
    risk_count = len(result.get("risk_flags", []))
    building = result.get("building_name", listing_id)
    return {
        "action": "research_listing",
        "agent_reply": (
            f"{building} 楼宇研究完成：整体评价 {signal}"
            + (f"，有 {risk_count} 个风险提示。" if risk_count > 0 else "，无明显风险。")
        ),
        "ui_update": {"tab": "research", "research_result": result},
    }


def _handle_draft_message(params: dict, context: dict) -> dict[str, Any]:
    listing_ids = context.get("selected_listing_ids") or context.get("top_listing_ids", [])
    if not listing_ids:
        return {
            "action": "draft_message",
            "agent_reply": "请先选择房源，再生成消息。",
            "ui_update": None,
        }
    client_name = context.get("client_name", "Demo User")
    # Import here to avoid circular dep issues
    from src.services.listing_service import get_listing_by_id
    listings = [l for lid in listing_ids if (l := get_listing_by_id(lid, demo_mode=_demo_mode()))]

    lines = [f"🏠 NYC Studio Shortlist for {client_name}\n"]
    for i, l in enumerate(listings, 1):
        enrich = l.get("_enrichment") or {}
        building = enrich.get("building_name") or l.get("address", "Unknown")
        price = l.get("price_monthly", 0)
        neighborhood = l.get("neighborhood", "LIC")
        commute = enrich.get("commute_midtown_min")
        commute_str = f"{commute} min to Midtown" if commute else "Commute: N/A"
        lines.append(f"{i}. {building} — {neighborhood}\n   💰 ${price:,}/mo | 🚇 {commute_str}")

    lines.append(f"\n🔗 Full comparison: http://localhost:3000/workspace")
    preview = "\n".join(lines)
    msg_result = {
        "message_preview": preview,
        "wecom_payload": {"msgtype": "text", "text": {"content": preview}},
        "sent": False,
        "listing_count": len(listings),
    }
    return {
        "action": "draft_message",
        "agent_reply": f"消息草稿已生成，包含 {len(listings)} 个房源。在 Message tab 查看预览。",
        "ui_update": {"tab": "message", "message_result": msg_result},
    }


def _handle_record_feedback(params: dict, context: dict) -> dict[str, Any]:
    note = params.get("note") or context.get("raw_text", "")
    client_id = context.get("client_id")
    if client_id and get_client(client_id):
        append_client_note(client_id, note)
    return {
        "action": "record_feedback",
        "agent_reply": f'已记录客户反馈：\n\u201c{note}\u201d',
        "ui_update": {"note_added": note},
    }


def _handle_update_requirements(params: dict, context: dict) -> dict[str, Any]:
    note = params.get("requirements") or context.get("raw_text", "")
    client_id = context.get("client_id")
    if client_id and get_client(client_id):
        append_client_note(client_id, f"[需求更新] {note}")
    return {
        "action": "update_requirements",
        "agent_reply": f'\u5df2\u66f4\u65b0\u9700\u6c42\u8bb0\u5f55\uff1a\u201c{note}\u201d\u3002\u5982\u9700\u91cd\u65b0\u641c\u7d22\uff0c\u8bf7\u544a\u8bc9\u6211\u3002',
        "ui_update": {"note_added": note},
    }


# ---------- main dispatch ----------

ACTION_HANDLERS = {
    "run_search": _handle_run_search,
    "filter_results": _handle_filter_results,
    "analyze_listing": _handle_analyze_listing,
    "compare_selected": _handle_compare_selected,
    "research_listing": _handle_research_listing,
    "draft_message": _handle_draft_message,
    "record_feedback": _handle_record_feedback,
    "update_requirements": _handle_update_requirements,
}


def dispatch_action(
    raw_text: str,
    context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Main entry: classify intent and dispatch to the appropriate action handler.

    context keys (all optional):
      client_id             — current active client
      client_name           — client display name
      profile               — user profile dict for fit/compare
      selected_listing_ids  — list of currently selected listing IDs
      target_listing_id     — a specific listing to act on
      top_listing_ids       — top N listing IDs from last search
    """
    ctx = dict(context or {})
    ctx["raw_text"] = raw_text

    intent = classify_intent(raw_text)
    action = intent.get("action", "run_search")
    params = intent.get("params", {})

    handler = ACTION_HANDLERS.get(action, _handle_run_search)
    try:
        result = handler(params, ctx)
    except Exception as e:
        result = {
            "action": action,
            "agent_reply": f"执行 {action} 时出错：{e}",
            "ui_update": None,
        }

    result["classified_intent"] = intent
    return result
