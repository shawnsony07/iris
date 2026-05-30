"use client";
import { useIrisStore } from "@/store/useIrisStore";

export function NodeBuilder() {
  const { selectedNodes, clearNodes } = useIrisStore();

  return (
    <div className="w-full bg-slate-800 p-4 h-[10vh] flex items-center justify-between shadow-md z-10 relative shrink-0">
      <div className="flex gap-2 flex-wrap overflow-y-auto h-full content-start items-start flex-1 mr-4 pr-2">
        {selectedNodes.map((node, i) => (
          <span key={i} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xl font-medium shadow">
            {node}
          </span>
        ))}
        {selectedNodes.length === 0 && <span className="text-gray-400 italic text-xl mt-2">No nodes selected...</span>}
      </div>
      <button 
        id="clear-block"
        onClick={clearNodes}
        data-disabled={selectedNodes.length === 0}
        className={`px-6 py-3 border-2 rounded-xl font-bold text-lg pointer-events-auto shrink-0 transition-opacity ${
          selectedNodes.length === 0 
            ? 'text-slate-500 border-slate-700 opacity-50' 
            : 'text-slate-300 hover:text-white border-slate-600'
        }`}
      >
        Clear
      </button>
    </div>
  );
}
