import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10 px-[10vw]"
      {...sceneTransitions.morphExpand}
    >
      <div className="w-full grid grid-cols-2 gap-[4vw]">
        <motion.div
          className="bg-white/5 p-[3vw] rounded-2xl border border-white/10"
          initial={{ opacity: 0, y: 50 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        >
          <h3 className="font-display text-[2.5vw] mb-[2vh]">Professional Rewrite</h3>
          <p className="text-[1.2vw] text-white/60 font-mono mb-[2vh]">
            From messy to meticulous in one click. Side-by-side comparison.
          </p>
          <div className="h-[2px] w-full bg-gradient-to-r from-accent to-transparent"></div>
        </motion.div>

        <motion.div
          className="bg-white/5 p-[3vw] rounded-2xl border border-white/10"
          initial={{ opacity: 0, y: 50 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        >
          <h3 className="font-display text-[2.5vw] mb-[2vh]">Jira Integration</h3>
          <p className="text-[1.2vw] text-white/60 font-mono mb-[2vh]">
            Import, score, and push scored reports back as Jira stories.
          </p>
          <div className="h-[2px] w-full bg-gradient-to-r from-highlight to-transparent"></div>
        </motion.div>
      </div>
    </motion.div>
  );
}
