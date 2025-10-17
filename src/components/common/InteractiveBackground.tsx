import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// Custom hook to track mouse position
const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      setMousePosition({ x: ev.clientX, y: ev.clientY });
    };
    window.addEventListener('mousemove', updateMousePosition);
    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);

  return mousePosition;
};

const InteractiveBackground: React.FC = () => {
  const { x, y } = useMousePosition();
  
  // Use springs for smooth, interpolated motion.
  // This makes the effect feel much more fluid and premium.
  const smoothOptions = { stiffness: 300, damping: 50, mass: 0.5 };
  const smoothX = useSpring(x, smoothOptions);
  const smoothY = useSpring(y, smoothOptions);

  // Framer Motion's useMotionValue and useTransform can also be used,
  // but useSpring is simpler for this direct tracking effect.
  const mouseX = useMotionValue(x);
  const mouseY = useMotionValue(y);

  useEffect(() => {
    mouseX.set(x);
    mouseY.set(y);
  }, [x, y, mouseX, mouseY]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background: `
          radial-gradient(
            600px at ${smoothX.get()}px ${smoothY.get()}px,
            hsla(var(--team-primary), 0.15),
            transparent 80%
          )
        `,
      }}
    />
  );
};

export default InteractiveBackground;
