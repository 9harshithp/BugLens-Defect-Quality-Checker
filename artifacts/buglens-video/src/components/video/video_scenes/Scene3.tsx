import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1800),
      setTimeout(() => setPhase(4), 2600),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      {...sceneTransitions.slideUp}
    >
      <motion.h2 
        className="font-display text-[4vw] mb-[4vh] text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      >
        Deep Analysis
      </motion.h2>

      <div className="flex gap-[4vw] w-[80vw]">
        <motion.div 
          className="flex-1 bg-white/5 p-[2vw] rounded-xl border border-white/10"
          initial={{ opacity: 0, x: -30 }}
          animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
        >
          <div className="flex items-center gap-[1vw] mb-[2vh]">
            <div className="w-[1.5vw] h-[1.5vw] rounded-full bg-accent"></div>
            <div className="text-[1.2vw] font-bold">Completeness</div>
          </div>
          <div className="w-full h-[1vh] bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-accent"
              initial={{ width: "0%" }}
              animate={phase >= 3 ? { width: "70%" } : { width: "0%" }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        <motion.div 
          className="flex-1 bg-white/5 p-[2vw] rounded-xl border border-white/10"
          initial={{ opacity: 0, x: 30 }}
          animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
        >
          <div className="flex items-center gap-[1vw] mb-[2vh]">
            <div className="w-[1.5vw] h-[1.5vw] rounded-full bg-highlight"></div>
            <div className="text-[1.2vw] font-bold">Junk Detection</div>
          </div>
          <motion.div 
            className="text-[1vw] font-mono bg-black/50 p-[1vw] rounded border border-highlight/50 text-highlight"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={phase >= 4 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          >
            > Stack trace extracted<br/>
            > Gibberish removed
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
