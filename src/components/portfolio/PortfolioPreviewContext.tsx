"use client";

import { createContext, useContext, useState } from "react";

const PortfolioPreviewContext = createContext<{
  isPreviewActive: boolean;
  setPreviewActive: (v: boolean) => void;
}>({ isPreviewActive: false, setPreviewActive: () => {} });

export function PortfolioPreviewProvider({ children }: { children: React.ReactNode }) {
  const [isPreviewActive, setPreviewActive] = useState(false);
  return (
    <PortfolioPreviewContext.Provider value={{ isPreviewActive, setPreviewActive }}>
      {children}
    </PortfolioPreviewContext.Provider>
  );
}

export function usePortfolioPreview() {
  return useContext(PortfolioPreviewContext);
}
