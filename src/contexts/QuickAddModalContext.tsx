import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { ExtractedBetLeg } from '../types';

type PropCreatedCallback = (leg: ExtractedBetLeg) => void;

interface QuickAddModalContextType {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  setPropCreatedCallback: (callback: PropCreatedCallback) => void;
  onPropCreated: (leg: ExtractedBetLeg) => void;
}

const QuickAddModalContext = createContext<QuickAddModalContextType | undefined>(undefined);

export const QuickAddModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [onPropCreatedCallback, setOnPropCreatedCallback] = useState<PropCreatedCallback>(() => () => {});

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const setPropCreatedCallback = useCallback((callback: PropCreatedCallback) => {
    setOnPropCreatedCallback(() => callback);
  }, []);

  const onPropCreated = (leg: ExtractedBetLeg) => {
    onPropCreatedCallback(leg);
  };

  const value = {
    isModalOpen,
    openModal,
    closeModal,
    setPropCreatedCallback,
    onPropCreated,
  };

  return (
    <QuickAddModalContext.Provider value={value}>
      {children}
    </QuickAddModalContext.Provider>
  );
};

export const useQuickAddModal = (): QuickAddModalContextType => {
  const context = useContext(QuickAddModalContext);
  if (context === undefined) {
    throw new Error('useQuickAddModal must be used within a QuickAddModalProvider');
  }
  return context;
};
