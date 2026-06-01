import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      {...sceneTransitions.scaleFade}
    >
      <div className="text-center">
        <motion.h1 
          className="font-display text-[6vw] font-bold leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          Bad bug reports <br />
          <span className="text-accent italic">waste time.</span>
        </motion.h1>

        <motion.div 
          className="mt-[4vh] max-w-[40vw] mx-auto p-[2vw] bg-white/5 border border-white/10 rounded-xl"
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          animate={phase >= 2 ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : { opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          transition={{ duration: 0.6, type: 'spring' }}
        >
          <div className="flex gap-[1vw] mb-[1vh]">
            <div className="w-[1vw] h-[1vw] rounded-full bg-red-500"></div>
            <div className="w-[10vw] h-[1vw] rounded bg-white/20"></div>
          </div>
          <div className="w-[20vw] h-[1vw] rounded bg-white/10 mb-[1vh]"></div>
          <div className="w-[15vw] h-[1vw] rounded bg-white/10"></div>
          <p className="mt-[2vh] text-error font-mono text-[1vw]">"It doesn't work sometimes"</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
