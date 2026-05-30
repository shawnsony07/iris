"use client";

import { useIrisStore } from "@/store/useIrisStore";


export function GridUI() {
  const { selectedNodes, predictions, isPredicting, coreBlocks, activeTone, sleepMode, showMediaModal, isTranscribing } = useIrisStore();

  const toneModifiers = ["Sarcastic", "Urgent", "Polite", "Joyful"];

  return (
    <>

      {isTranscribing && (
        <div className="fixed top-0 left-1/2 -translate-x-1/2 bg-yellow-600 text-white px-12 py-2 rounded-b-2xl font-bold text-xl shadow-lg z-[9999] flex items-center gap-4 animate-pulse">
          <div className="w-4 h-4 bg-white rounded-full animate-bounce"></div>
          Transcribing...
        </div>
      )}

      {sleepMode && (
        <div className="fixed inset-0 bg-black/95 z-[9000] flex">
          <div
            id="wake-block"
            className="absolute top-8 right-8 w-64 h-64 bg-slate-800 border-8 border-slate-600 rounded-3xl flex items-center justify-center text-5xl font-black text-white shadow-2xl"
          >
            WAKE
          </div>
        </div>
      )}

      {showMediaModal && (
        <div className="fixed inset-0 bg-black/90 z-[8000] flex items-center justify-center p-16">
          <div className="bg-slate-900 w-full h-full rounded-3xl overflow-hidden relative flex flex-col border-4 border-slate-700 shadow-2xl">
            <div
              id="close-modal"
              className="absolute top-4 right-4 bg-red-600 border-4 border-red-400 text-white font-bold px-12 py-6 rounded-2xl text-3xl z-10"
            >
              Close Media
            </div>
            {/* Mock Media Iframe */}
            <iframe
              className="w-full h-full pointer-events-auto"
              src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      <div className="flex w-full h-full bg-slate-950">
        {/* Left Tone Column */}
        <div className="w-48 flex flex-col gap-[4vh] p-8 pr-0 border-r-4 border-slate-800">
          <div className="text-slate-500 font-bold text-center tracking-widest text-sm uppercase">Tones</div>

          {toneModifiers.map((tone) => (
            <div
              key={tone}
              id={`tone-block-${tone}`}
              className={`h-full w-full rounded-xl flex items-center justify-center font-bold text-3xl border-4 transition-all ${
                activeTone === tone
                  ? 'bg-purple-600 text-white border-purple-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {tone}
            </div>
          ))}
        </div>

        {/* Main Grid Area */}
        <div className="flex flex-col w-full h-full gap-[4vh] p-8">
          {/* Top Prediction Strip (20%) */}
          <div className="h-[20vh] shrink-0 pb-4 flex gap-[5vw] w-full items-stretch">
            {isPredicting ? (
              <>
                <div className="h-full w-full rounded-xl bg-slate-800 animate-pulse border-4 border-slate-700"></div>
                <div className="h-full w-full rounded-xl bg-slate-800 animate-pulse border-4 border-slate-700"></div>
                <div className="h-full w-full rounded-xl bg-slate-800 animate-pulse border-4 border-slate-700"></div>
              </>
            ) : (
              predictions.map((word) => (
                <div
                  key={`pred-${word}`}
                  data-block-id={word}
                  className="h-full w-full rounded-xl flex items-center justify-center text-3xl font-bold shadow-lg border-4 transition-all bg-emerald-900 text-emerald-100 border-emerald-700 hover:bg-emerald-800"
                >
                  {word}
                </div>
              ))
            )}
          </div>

          {/* Bottom Core Grid (80%) */}
          <div className="flex-1 min-h-0">
            <div className="grid grid-cols-4 grid-rows-3 h-full w-full gap-x-[5vw] gap-y-[4vh]">
              {coreBlocks.map((block) => {
                const isSelected = selectedNodes.includes(block);
                return (
                  <div
                    key={block}
                    id={`grid-block-${block}`}
                    data-disabled={isSelected}
                    className={`h-full w-full rounded-xl flex items-center justify-center text-3xl font-bold text-center shadow-lg border-4 transition-all ${
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
          </div>
        </div>
      </div>
    </>
  );
}
