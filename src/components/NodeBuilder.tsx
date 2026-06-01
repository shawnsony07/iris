"use client";
import { useIrisStore } from "@/store/useIrisStore";

export function NodeBuilder() {
  const { selectedNodes, clearNodes, isContextResponse } = useIrisStore();
  const isClearDisabled = selectedNodes.length === 0 && !isContextResponse;

  return (
    <div className="w-full h-[9vh] shrink-0 px-6 py-3 flex items-center justify-between z-10 relative iris-glass-strong border-b border-[var(--iris-border-subtle)]">
      {/* Selected node chips */}
      <div className="flex gap-2 flex-wrap overflow-y-auto h-full content-start items-start flex-1 mr-4 pr-2">
        {selectedNodes.map((node, i) => (
          <span
            key={i}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-[var(--iris-accent)]/30 bg-[var(--iris-accent)]/10 text-[var(--iris-accent)]"
            style={{ animation: `iris-scale-in 0.2s ease-out ${i * 0.05}s both` }}
          >
            {node}
          </span>
        ))}
        {selectedNodes.length === 0 && (
          <span className="text-[var(--iris-text-muted)] text-sm mt-1.5">
            Select symbols to build a sentence…
          </span>
        )}
      </div>

      {/* Clear button */}
      <button
        id="clear-block"
        onClick={clearNodes}
        data-disabled={isClearDisabled || undefined}
        className={`px-4 py-2 rounded-lg text-sm font-medium tracking-wide border transition-all shrink-0 ${
          isClearDisabled
            ? "text-[var(--iris-text-muted)] border-[var(--iris-border-subtle)] opacity-40 cursor-default"
            : "text-[var(--iris-text-secondary)] border-[var(--iris-border)] hover:text-[var(--iris-text)] hover:border-[var(--iris-text-muted)] hover:bg-[var(--iris-surface-hover)] cursor-pointer"
        }`}
      >
        Clear
      </button>
    </div>
  );
}
