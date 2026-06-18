"use client";

import { Listing } from "@/lib/api";
import ListingCard from "@/components/ListingCard";
import { motion } from "framer-motion";

interface Props {
  listings: Listing[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onAnalyze: (id: string) => void;
  onResearch: (id: string) => void;
  isLoading?: boolean;
  parsedSummary?: string;
}

export default function ListingsTab({ listings, selectedIds, onSelect, onAnalyze, onResearch, isLoading, parsedSummary }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-slate-800/60 rounded-xl h-60 animate-pulse border border-white/5" />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-8">
        <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center mb-4">
          <span className="text-2xl">🏠</span>
        </div>
        <p className="text-slate-400 text-sm font-medium mb-2">暂无房源</p>
        <p className="text-slate-600 text-xs">在左侧 Agent Console 中输入搜索指令，例如：<br />"帮 Emily 找 LIC studio，预算 3200 以下"</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {parsedSummary && (
        <div className="flex-shrink-0 mx-4 mt-4 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2.5">
          <p className="text-blue-300 text-xs leading-relaxed">{parsedSummary}</p>
        </div>
      )}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3">
        <p className="text-xs text-slate-500">
          {listings.length} 个结果 · {selectedIds.size > 0 ? `已选 ${selectedIds.size}` : "点击 + 选择房源进行对比"}
        </p>
        {selectedIds.size >= 2 && (
          <span className="text-xs text-emerald-400 font-medium">
            已选 {selectedIds.size} 个 · 可在 Agent Console 输入"对比"
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {listings.map((listing, idx) => (
            <div key={listing.listing_id} className="relative group">
              {idx < 3 && (
                <div className={`absolute -top-2 -left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ${
                  idx === 0 ? "bg-emerald-500" : idx === 1 ? "bg-blue-500" : "bg-slate-500"
                }`}>
                  {idx + 1}
                </div>
              )}
              <ListingCard
                listing={listing}
                selected={selectedIds.has(listing.listing_id)}
                onSelect={onSelect}
                showSelectButton
              />
              {/* Action buttons overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute bottom-14 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <button
                  onClick={() => onAnalyze(listing.listing_id)}
                  className="bg-slate-700 hover:bg-slate-600 border border-white/10 text-xs text-slate-300 px-2.5 py-1 rounded-lg transition-colors shadow-lg"
                >
                  Analyze
                </button>
                <button
                  onClick={() => onResearch(listing.listing_id)}
                  className="bg-slate-700 hover:bg-slate-600 border border-white/10 text-xs text-slate-300 px-2.5 py-1 rounded-lg transition-colors shadow-lg"
                >
                  Research
                </button>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
