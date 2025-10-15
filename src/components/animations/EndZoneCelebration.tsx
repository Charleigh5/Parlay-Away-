import React, { useEffect, useMemo } from 'react';
// Fix: Alias motion import to avoid potential name collisions causing type errors.
import { motion as motionComponent, AnimatePresence } from 'framer-motion';

interface EndZoneCelebrationProps {
  onComplete: () => void;
}

const ConfettiPiece: React.FC<{ initialX: number; initialY: number; color: string }> = ({ initialX, initialY, color }) => {
  const duration = useMemo(() => Math.random() * 2 + 3, []);
  const rotate = useMemo(() => Math.random() * 720 - 360, []);
  const finalX = useMemo(() => initialX + (Math.random() - 0.5) * 400, [initialX]);
  
  return (
    <motionComponent.div
      style={{
        position: 'absolute',
        left: initialX,
        top: initialY,
        width: 10,
        height: 10,
        backgroundColor: color,
        opacity: 0,
      }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: window.innerHeight + 20,
        x: finalX,
        rotate,
      }}
      transition={{
        duration,
        ease: 'linear',
        times: [0, 0.1, 0.9, 1],
      }}
    />
  );
};


const EndZoneCelebration: React.FC<EndZoneCelebrationProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const confetti = useMemo(() => {
    const primaryColor = `hsl(var(--team-primary))`;
    const secondaryColor = `hsl(var(--team-secondary))`;
    return Array.from({ length: 100 }).map((_, i) => (
      <ConfettiPiece
        key={i}
        initialX={Math.random() * window.innerWidth}
        initialY={-20}
        color={i % 2 === 0 ? primaryColor : secondaryColor}
      />
    ));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden">
        {confetti}
         <motionComponent.div
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            animate={{ opacity: [0, 1, 1, 0], scale: 1, y: 0 }}
            transition={{ duration: 4, times: [0, 0.2, 0.8, 1] }}
            className="text-center"
        >
            <h2 className="text-6xl font-extrabold text-white" style={{ textShadow: '0 0 20px hsl(var(--team-primary))' }}>
                STREAK!
            </h2>
            <p className="text-2xl font-semibold text-gray-300 mt-2">You're on fire!</p>
        </motionComponent.div>
    </div>
  );
};

export default EndZoneCelebration;
