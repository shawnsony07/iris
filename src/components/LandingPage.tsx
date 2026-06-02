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
      className="absolute inset-0 z-[1000] bg-[var(--iris-bg)] text-[var(--iris-text)] flex flex-col items-center justify-center p-8 overflow-hidden"
    >
      {/* Background glow or subtle effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--iris-accent)]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="z-10 max-w-2xl w-full flex flex-col items-center text-center space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          {/* Logo Placeholder */}
          <div className="mb-6 bg-[var(--iris-surface)] p-4 rounded-full shadow-[var(--shadow-elevated)] border border-[var(--iris-border)]">
            <Eye className="w-10 h-10 text-[var(--iris-text)]" strokeWidth={2} />
          </div>
          <h1 className={`${playfair.className} text-7xl md:text-8xl tracking-tight font-bold mb-6 text-[var(--iris-text)]`}>
            Iris
          </h1>
          <h2 className="text-2xl md:text-3xl text-slate-700 font-medium mb-6 tracking-wide text-center">
            Advanced eye-tracking. <span className="text-slate-900 font-bold">Zero hardware required.</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 font-medium max-w-2xl leading-relaxed text-center">
            Browser-based communication OS that listens to the room, predicts your needs, and tracks your gaze with mathematical perfection. <span className="font-bold text-slate-900">Giving paralyzed patients their autonomy back, one blink at a time.</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <button
            onClick={handleStart}
            className="group relative px-10 py-5 bg-[#5c3d2e] text-white rounded-full text-xl font-bold tracking-wide hover:scale-105 transition-transform duration-300 ease-out shadow-[0_10px_20px_rgba(92,61,46,0.3)]"
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
