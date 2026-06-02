'use client';

import { motion } from 'framer-motion';
import { Playfair_Display } from 'next/font/google';
import { useIrisStore } from '@/store/useIrisStore';
import { useContext } from 'react';
import { GazeContext } from '@/lib/gazeContext';
import { Eye } from 'lucide-react';

const playfair = Playfair_Display({ subsets: ['latin'] });

export function LandingPage() {
  const setAppStage = useIrisStore(state => state.setAppStage);
  const { initialize } = useContext(GazeContext);

  const handleStart = () => {
    // 1. Trigger camera/model load
    initialize();
    // 2. Go to calibrating state
    setAppStage('calibrating');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[1000] bg-[#030912] text-white flex flex-col items-center justify-center p-8 overflow-hidden"
    >
      {/* Background glow or subtle effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="z-10 max-w-2xl w-full flex flex-col items-center text-center space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          {/* Logo Placeholder */}
          <div className="mb-6 bg-white/5 p-4 rounded-full backdrop-blur-sm border border-white/10">
            <Eye className="w-10 h-10 text-emerald-400" strokeWidth={1} />
          </div>
          <h1 className={`${playfair.className} text-7xl md:text-8xl tracking-tight font-medium mb-6 text-emerald-50`}>
            Iris
          </h1>
          <h2 className="text-2xl md:text-3xl text-emerald-100 font-light mb-6 tracking-wide text-center">
            Advanced eye-tracking. <span className="text-emerald-400 font-medium">Zero hardware required.</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-400 font-light max-w-2xl leading-relaxed text-center">
            Browser-based communication OS that listens to the room, predicts your needs, and tracks your gaze with mathematical perfection. Giving paralyzed patients their autonomy back, one blink at a time.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <button
            onClick={handleStart}
            className="group relative px-8 py-4 bg-emerald-500 text-emerald-950 rounded-full text-lg font-medium tracking-wide hover:scale-105 transition-transform duration-300 ease-out shadow-[0_0_40px_rgba(16,185,129,0.3)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Experience
              <motion.span
                className="inline-block"
                initial={{ x: 0 }}
                whileHover={{ x: 5 }}
              >
                →
              </motion.span>
            </span>
          </button>
        </motion.div>
      </div>

    </motion.div>
  );
}
