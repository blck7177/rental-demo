"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getListings, notifyWecom, Listing, NotifyResult } from "@/lib/api";
import Link from "next/link";

function NotifyContent() {
  const searchParams = useSearchParams();
  const initialIds = searchParams.get("ids")?.split(",").filter(Boolean) || [];

  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds.slice(0, 3));
  const [profileName, setProfileName] = useState("Demo User");
  const [loading, setLoading] = useState(false);
  const [loadingListings, setLoadingListings] = useState(true);
  const [result, setResult] = useState<NotifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendToWecom, setSendToWecom] = useState(false);

  useEffect(() => {
    getListings()
      .then((d) => setAllListings(d.listings))
      .finally(() => setLoadingListings(false));
  }, []);

  async function generateMessage(send = false) {
    if (selectedIds.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const data = await notifyWecom(selectedIds, profileName, send);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate message");
    } finally {
      setLoading(false);
    }
  }

  function toggleId(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length < 5) return [...prev, id];
      return prev;
    });
  }

  const getListingName = (id: string) => {
    const l = allListings.find((x) => x.listing_id === id);
    return l?._enrichment?.building_name || l?.address?.split(",")[0] || id;
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Push Shortlist</h1>
        <p className="text-slate-500 text-sm mt-1">
          Generate a WeCom/WeChat-style shortlist message and send to a group webhook
        </p>
      </div>

      {/* Config */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 space-y-5">
        {/* Profile name */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            For
          </label>
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 w-full"
          />
        </div>

        {/* Listing selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Listings to include ({selectedIds.length} selected)
          </label>
          {loadingListings ? (
            <div className="text-slate-500 text-sm">Loading...</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allListings.map((l) => {
                const name = l._enrichment?.building_name || l.address?.split(",")[0] || l.listing_id;
                const isSelected = selectedIds.includes(l.listing_id);
                return (
                  <button
                    key={l.listing_id}
                    onClick={() => toggleId(l.listing_id)}
                    className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {isSelected && "✓ "}${l.price_monthly?.toLocaleString()} {name?.substring(0, 16)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* WeCom toggle */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={sendToWecom}
              onChange={(e) => setSendToWecom(e.target.checked)}
              className="accent-emerald-600"
            />
            Send to WeCom webhook (requires WECOM_WEBHOOK_URL in .env)
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => generateMessage(false)}
            disabled={loading || selectedIds.length === 0}
            className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Generating..." : "Preview Message"}
          </button>
          {sendToWecom && (
            <button
              onClick={() => generateMessage(true)}
              disabled={loading || selectedIds.length === 0}
              className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              Send to WeCom
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">{error}</div>
      )}

      {/* Preview */}
      {result && (
        <div className="space-y-5">
          {/* Send status */}
          {sendToWecom && (
            <div className={`rounded-lg border p-4 text-sm ${result.sent ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-yellow-50 border-yellow-200 text-yellow-700"}`}>
              {result.sent ? (
                <span>✓ Sent to WeCom successfully ({result.listing_count} listings)</span>
              ) : (
                <span>
                  Message generated but not sent.
                  {result.send_error && ` Reason: ${result.send_error}`}
                </span>
              )}
            </div>
          )}

          {/* Message preview — styled as WeCom message */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">WeCom Message Preview</p>
            </div>
            {/* Bubble style */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <pre className="whitespace-pre-wrap text-sm text-slate-800 font-sans leading-relaxed">
                {result.message_preview}
              </pre>
            </div>
          </div>

          {/* Copy button */}
          <button
            onClick={() => navigator.clipboard.writeText(result.message_preview)}
            className="w-full border border-slate-200 text-slate-600 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            📋 Copy to Clipboard
          </button>

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href="/compare"
              className="flex-1 text-center border border-slate-200 text-slate-700 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors"
            >
              ← Compare Listings
            </Link>
            <Link
              href="/listings"
              className="flex-1 text-center bg-slate-900 text-white py-2.5 rounded-lg text-sm hover:bg-slate-700 transition-colors"
            >
              Browse More Listings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NotifyPage() {
  return (
    <Suspense fallback={<div className="p-10 text-slate-500">Loading...</div>}>
      <NotifyContent />
    </Suspense>
  );
}
