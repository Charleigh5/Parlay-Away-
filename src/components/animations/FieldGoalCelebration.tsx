import React, { useEffect } from 'react';
// FIX: Add alias to motion import to avoid potential name collisions causing type errors.
import { motion as motionComponent, useAnimation } from 'framer-motion';
import { useTeamTheme } from '../../hooks/useTeamTheme';
import Uprights from '../../assets/svg/Uprights';
import Football from '../../assets/svg/Football';

interface FieldGoalCelebrationProps {
  onComplete: () => void;
}

const FieldGoalCelebration: React.FC<FieldGoalCelebrationProps> = ({ onComplete }) => {
  const { selectedTeam } = useTeamTheme();
  const controls = useAnimation();

  useEffect(() => {
    const sequence = async () => {
      await controls.start('visible');
      await controls.start('kick');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await controls.start('exit');
      onComplete();
    };

    sequence();
  }, [controls, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motionComponent.div
        className="relative w-full h-full"
        initial="hidden"
        animate={controls}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
          exit: { opacity: 0, transition: { duration: 0.5 } },
        }}
      >
        <motionComponent.div
          className="absolute inset-0 flex items-center justify-center"
          variants={{
            hidden: { scale: 0.5, opacity: 0 },
            visible: { scale: 1, opacity: 1, transition: { type: 'spring', damping: 10, stiffness: 100 } },
          }}
        >
          <Uprights className="w-1/2 md:w-1/3 text-white" />
        </motionComponent.div>

        <motionComponent.div
          className="absolute inset-0"
          variants={{
            kick: {
              transition: {
                path: { duration: 1.5, ease: 'easeInOut' },
              },
            },
          }}
        >
          <motionComponent.div
            style={{
              position: 'absolute',
              width: '100px',
              height: 'auto',
              offsetPath: `path("M ${window.innerWidth / 2},${window.innerHeight + 50} C ${window.innerWidth / 2},${window.innerHeight * 0.7} ${window.innerWidth / 2},${window.innerHeight * 0.7} ${window.innerWidth / 2},${window.innerHeight * 0.3}")`,
              offsetRotate: 'auto',
            }}
            variants={{
              kick: {
                offset: [0, 1],
                scale: [0.5, 1, 0.2],
                rotate: [0, 720],
              },
            }}
          >
            <Football accentColor="var(--team-accent)" />
          </motionComponent.div>
        </motionComponent.div>

        <motionComponent.div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 text-5xl font-extrabold tracking-widest text-white"
            style={{ textShadow: '0 0 15px hsl(var(--team-accent))' }}
            variants={{
                hidden: { opacity: 0, scale: 0 },
                kick: { opacity: [0, 1, 1, 0], scale: [0, 1.2, 1, 0], transition: { delay: 1, times: [0, 0.2, 0.8, 1], duration: 1.5 } }
            }}
        >
            IT'S GOOD!
        </motionComponent.div>
      </motionComponent.div>
    </div>
  );
};

export default FieldGoalCelebration;