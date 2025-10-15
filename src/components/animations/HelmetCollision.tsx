import React, { useEffect } from 'react';
// Fix: Alias motion import to avoid potential name collisions causing type errors.
import { motion as motionComponent, useAnimation } from 'framer-motion';
import NflHelmet from '../../assets/svg/NflHelmet';

interface HelmetCollisionProps {
  onComplete: () => void;
}

const HelmetCollision: React.FC<HelmetCollisionProps> = ({ onComplete }) => {
  const controls = useAnimation();

  useEffect(() => {
    const sequence = async () => {
      await controls.start('enter');
      await new Promise(resolve => setTimeout(resolve, 600));
      await controls.start('exit');
      onComplete();
    };
    sequence();
  }, [controls, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <motionComponent.div initial="hidden" animate={controls}>
        <motionComponent.div
          variants={{
            hidden: { x: '-100vw', rotate: -90 },
            enter: { x: -50, rotate: 0, transition: { type: 'spring', damping: 15, stiffness: 150 } },
            exit: { x: '-100vw', rotate: -90, transition: { ease: 'easeInOut', duration: 0.3 } },
          }}
        >
          <NflHelmet className="w-32 h-32" />
        </motionComponent.div>
      </motionComponent.div>
      <motionComponent.div initial="hidden" animate={controls}>
        <motionComponent.div
          variants={{
            hidden: { x: '100vw', rotate: 90 },
            enter: { x: 50, rotate: 0, transition: { type: 'spring', damping: 15, stiffness: 150 } },
            exit: { x: '100vw', rotate: 90, transition: { ease: 'easeInOut', duration: 0.3 } },
          }}
          className="scale-x-[-1]"
        >
          <NflHelmet className="w-32 h-32" />
        </motionComponent.div>
      </motionComponent.div>
      <motionComponent.div
        className="absolute"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 0], scale: [0, 2, 0], transition: { delay: 0.2, duration: 0.4 } }}
      >
        <span className="text-3xl font-black text-white" style={{ textShadow: '0 0 10px white' }}>CRUNCH!</span>
      </motionComponent.div>
    </div>
  );
};

export default HelmetCollision;
