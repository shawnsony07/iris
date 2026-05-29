"use client";

import { useIrisStore } from "@/store/useIrisStore";

export function GridUI() {
  const { addNode, selectedNodes } = useIrisStore();

  const blocks = ["Physical", "Social", "Pain", "Adjust", "Yes", "No", "Hungry", "Thirsty"];

  return (
    <div className="grid grid-cols-4 gap-4 p-8 w-full h-full min-h-[80vh] items-stretch">
      {blocks.map((block) => {
        const isSelected = selectedNodes.includes(block);
        return (
          <div
            key={block}
            id={`grid-block-${block}`}
            data-disabled={isSelected}
            className={`flex items-center justify-center text-3xl font-bold rounded-2xl shadow-lg border-4 transition-all ${
              isSelected 
                ? 'bg-slate-700 text-slate-400 border-slate-600 opacity-60' 
                : 'bg-blue-900 text-white border-blue-800 hover:bg-blue-800'
            }`}
          >
            {block}
          </div>
        );
      })}
    </div>
  );
}
