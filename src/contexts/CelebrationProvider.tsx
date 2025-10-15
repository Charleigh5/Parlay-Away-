import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

interface CelebrationContextType {
  isFieldGoal: boolean;
  isLionsRoar: boolean;
  isHelmetCollision: boolean;
  isEndZone: boolean;
  triggerFieldGoal: () => void;
  triggerLionsRoar: () => void;
  triggerHelmetCollision: () => void;
  triggerEndZoneCelebration: () => void;
  clearAllCelebrations: () => void;
}

const CelebrationContext = createContext<CelebrationContextType | undefined>(undefined);

export const CelebrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isFieldGoal, setIsFieldGoal] = useState(false);
  const [isLionsRoar, setIsLionsRoar] = useState(false);
  const [isHelmetCollision, setIsHelmetCollision] = useState(false);
  const [isEndZone, setIsEndZone] = useState(false);

  const triggerFieldGoal = useCallback(() => setIsFieldGoal(true), []);
  const triggerLionsRoar = useCallback(() => setIsLionsRoar(true), []);
  const triggerHelmetCollision = useCallback(() => setIsHelmetCollision(true), []);
  const triggerEndZoneCelebration = useCallback(() => setIsEndZone(true), []);

  const clearAllCelebrations = useCallback(() => {
    setIsFieldGoal(false);
    setIsLionsRoar(false);
    setIsHelmetCollision(false);
    setIsEndZone(false);
  }, []);

  const value = {
    isFieldGoal,
    isLionsRoar,
    isHelmetCollision,
    isEndZone,
    triggerFieldGoal,
    triggerLionsRoar,
    triggerHelmetCollision,
    triggerEndZoneCelebration,
    clearAllCelebrations,
  };

  return (
    <CelebrationContext.Provider value={value}>
      {children}
    </CelebrationContext.Provider>
  );
};

export const useCelebration = (): CelebrationContextType => {
  const context = useContext(CelebrationContext);
  if (context === undefined) {
    throw new Error('useCelebration must be used within a CelebrationProvider');
  }
  return context;
};