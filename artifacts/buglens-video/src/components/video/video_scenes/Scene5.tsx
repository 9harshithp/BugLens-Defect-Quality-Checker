import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      {...sceneTransitions.zoomThrough}
    >
      <motion.div
        className="flex items-center text-[8vw] font-display font-bold"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
        transition={{ duration: 1, type: 'spring' }}
      >
        Bug<span className="text-accent italic">Lens</span>
      </motion.div>
      
      <motion.div
        className="mt-[2vh] text-[1.5vw] font-mono text-white/70 tracking-widest uppercase"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        Defect Quality Checker
      </motion.div>
    </motion.div>
  );
}
