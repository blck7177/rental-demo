const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${err}`);
  }
  return res.json();
}

// Types
export interface NotifyResult {
  message_preview: string;
  wecom_payload: unknown;
  sent: boolean;
  send_error?: string;
  listing_count: number;
}

export interface Enrichment {
  building_name?: string;
  management_company?: string;
  lat?: number;
  lng?: number;
  subway_lines?: string[];
  subway_station?: string;
  subway_walk_min?: number;
  commute_midtown_min?: number;
  commute_downtown_min?: number;
  neighborhood_vibe?: string;
  google_rating?: number;
  google_review_count?: number;
  year_built?: number;
  total_units?: number;
}

export interface ReviewSummary {
  overall_signal?: string;
  google_rating?: number;
  risk_flags?: { type: string; severity: string; evidence: string }[];
}

export interface Listing {
  listing_id: string;
  url: string;
  source: string;
  price_monthly: number;
  bedrooms: number;
  borough: string;
  neighborhood?: string;
  address?: string;
  bathrooms?: number;
  sq_ft?: number;
  floor?: number;
  available_date?: string;
  description_snippet?: string;
  amenities?: string[];
  pet_policy?: string;
  laundry?: string;
  doorman?: boolean;
  elevator?: boolean;
  no_fee?: boolean;
  listing_type?: string;
  quality_tier?: string;
  status?: string;
  _enrichment?: Enrichment;
  _review_summary?: ReviewSummary;
  _fit_score?: number;
}

export interface UserProfile {
  profile_id: string;
  name: string;
  budget_max: number;
  budget_min?: number;
  neighborhoods: string[];
  boroughs: string[];
  bedrooms: number;
  must_haves: string[];
  nice_to_haves: string[];
  avoid: string[];
  pet: boolean;
  weights: { price: number; commute: number; building_quality: number; amenities: number };
  commute_destination: string;
  notes?: string;
}

// Listings
export async function getListings(params?: Record<string, string | number | boolean>): Promise<{ total: number; listings: Listing[] }> {
  const qs = params ? "?" + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : "";
  return apiFetch(`/api/listings${qs}`);
}

export async function getListing(id: string): Promise<Listing> {
  return apiFetch(`/api/listings/${id}`);
}

// Intake
export async function postIntake(nlText: string, formData?: Record<string, unknown>): Promise<{ profile: UserProfile }> {
  return apiFetch("/api/intake", {
    method: "POST",
    body: JSON.stringify({ nl_text: nlText, form_data: formData }),
  });
}

export async function getDemoProfile(): Promise<{ profile: UserProfile }> {
  return apiFetch("/api/intake/demo-profile");
}

// NL Query
export async function nlQuery(query: string): Promise<{
  query: string;
  parsed: { filters: Record<string, unknown>; ranking_intent: Record<string, unknown>; parsed_summary: string };
  total_results: number;
  results: Listing[];
}> {
  return apiFetch("/api/query/nl", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}

// Analysis
export async function fitAnalysis(listingId: string, profile?: UserProfile): Promise<{
  fit_score: number;
  fit_label: string;
  why_it_matches: string[];
  tradeoffs: string[];
  verdict: string;
  score_breakdown: Record<string, number>;
}> {
  return apiFetch("/api/analysis/fit", {
    method: "POST",
    body: JSON.stringify({ listing_id: listingId, profile }),
  });
}

export async function compareListings(listingIds: string[], profile?: UserProfile): Promise<{
  summary: string;
  verdicts: Record<string, string>;
  verdict_explanations: Record<string, string>;
  comparison_rows: { category: string; values: Record<string, string>; winner?: string }[];
  bottom_line: string;
  listings: Record<string, unknown>[];
}> {
  return apiFetch("/api/analysis/compare", {
    method: "POST",
    body: JSON.stringify({ listing_ids: listingIds, profile }),
  });
}

// Research
export async function getResearch(listingId: string): Promise<{
  building_name: string;
  overall_signal: string;
  rating_snapshot: { google_rating?: number; review_count?: number };
  positive_themes: string[];
  negative_themes: string[];
  risk_flags: { type: string; severity: string; evidence: string }[];
  research_notes: string;
}> {
  return apiFetch(`/api/research/${listingId}`);
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

export async function postResearch(listingId: string): Promise<ResearchResult> {
  return apiFetch<ResearchResult>("/api/research/building", {
    method: "POST",
    body: JSON.stringify({ listing_id: listingId }),
  });
}

// Runs
export async function startDemoRun(): Promise<{
  run_id: string;
  status: string;
  steps: { step: string; label: string; count: number }[];
  summary: Record<string, unknown>;
}> {
  return apiFetch("/api/runs/demo", { method: "POST", body: JSON.stringify({ mode: "demo" }) });
}

// Notify
export async function notifyWecom(listingIds: string[], profileName?: string, sendToWecom?: boolean): Promise<NotifyResult> {
  return apiFetch<NotifyResult>("/api/notify/wecom", {
    method: "POST",
    body: JSON.stringify({
      listing_ids: listingIds,
      profile_name: profileName || "Demo User",
      send_to_wecom: sendToWecom || false,
    }),
  });
}
