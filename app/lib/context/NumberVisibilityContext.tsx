'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NumberVisibilityContextType {
  numbersVisible: boolean;
  toggleNumbersVisibility: () => void;
}

const NumberVisibilityContext = createContext<NumberVisibilityContextType | undefined>(undefined);

export function NumberVisibilityProvider({ children }: { children: ReactNode }) {
  const [numbersVisible, setNumbersVisible] = useState(true);

  const toggleNumbersVisibility = () => {
    setNumbersVisible(prev => !prev);
  };

  return (
    <NumberVisibilityContext.Provider value={{ numbersVisible, toggleNumbersVisibility }}>
      {children}
    </NumberVisibilityContext.Provider>
  );
}

export function useNumberVisibility() {
  const context = useContext(NumberVisibilityContext);
  if (context === undefined) {
    throw new Error('useNumberVisibility must be used within a NumberVisibilityProvider');
  }
  return context;
} 