import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 px-[10vw]"
      {...sceneTransitions.clipCircle}
    >
      <div className="w-full flex justify-between items-center">
        <motion.div
          className="w-[45%]"
          initial={{ opacity: 0, x: -50 }}
          animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h2 className="font-display text-[5vw] font-bold leading-tight">
            Score & <br/> Improve.
          </h2>
          <p className="text-[1.5vw] text-white/70 mt-[2vh] max-w-[30vw]">
            BugLens scores bug reports on a 100-point rubric across 7 dimensions.
          </p>
        </motion.div>

        <motion.div
          className="w-[45%] relative aspect-square flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.8, rotate: -10 }}
          transition={{ duration: 1, type: 'spring', bounce: 0.4 }}
        >
          {/* Circular Score representation */}
          <div className="w-[80%] h-[80%] rounded-full border-[2vw] border-white/5 relative flex items-center justify-center">
             <motion.svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <motion.circle
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke="var(--color-highlight)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="251"
                  initial={{ strokeDashoffset: 251 }}
                  animate={phase >= 3 ? { strokeDashoffset: 30 } : { strokeDashoffset: 251 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
             </motion.svg>
             <motion.div 
               className="text-[6vw] font-mono font-bold text-highlight"
               initial={{ opacity: 0 }}
               animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
             >
               88
             </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
