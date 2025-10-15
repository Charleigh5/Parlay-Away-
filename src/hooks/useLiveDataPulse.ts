import { useState, useEffect, useRef } from 'react';

export const useLiveDataPulse = (dataVersion: number): boolean => {
  const [isPulsing, setIsPulsing] = useState(false);
  const prevVersionRef = useRef(dataVersion);

  useEffect(() => {
    // We only want to pulse on updates, not the initial load.
    if (dataVersion > 1 && dataVersion !== prevVersionRef.current) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 1000); // Duration of the CSS animation
      
      prevVersionRef.current = dataVersion;

      return () => clearTimeout(timer);
    }
  }, [dataVersion]);

  return isPulsing;
};