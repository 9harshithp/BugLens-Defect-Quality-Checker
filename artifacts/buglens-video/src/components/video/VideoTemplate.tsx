import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

const SCENE_DURATIONS = {
  problem: 4000,
  solution: 4500,
  analyzer: 5000,
  integration: 4500,
  outro: 4000
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-bg-base text-text-base">
      {/* Persistent Background Layer */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <motion.div
          className="absolute top-[20%] left-[30%] w-[50vw] h-[50vw] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, var(--color-accent), transparent)' }}
          animate={{
            x: ['-10%', '20%', '-10%'],
            y: ['0%', '10%', '0%'],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, var(--color-highlight), transparent)' }}
          animate={{
            x: ['10%', '-20%', '10%'],
            y: ['-10%', '5%', '-10%'],
            scale: [1.2, 1, 1.2],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <Scene1 key="problem" />}
        {currentScene === 1 && <Scene2 key="solution" />}
        {currentScene === 2 && <Scene3 key="analyzer" />}
        {currentScene === 3 && <Scene4 key="integration" />}
        {currentScene === 4 && <Scene5 key="outro" />}
      </AnimatePresence>
    </div>
  );
}
