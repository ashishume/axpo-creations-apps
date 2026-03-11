import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type BusinessMode = "factory" | "shop";

interface BusinessModeContextType {
  mode: BusinessMode;
  setMode: (mode: BusinessMode) => void;
}

const BusinessModeContext = createContext<BusinessModeContextType | undefined>(undefined);

const STORAGE_KEY = "axpo-billing-mode";

export function BusinessModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<BusinessMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === "factory" || stored === "shop") ? stored : "shop";
  });

  const setMode = (newMode: BusinessMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  return (
    <BusinessModeContext.Provider value={{ mode, setMode }}>
      {children}
    </BusinessModeContext.Provider>
  );
}

export function useBusinessMode() {
  const context = useContext(BusinessModeContext);
  if (!context) {
    throw new Error("useBusinessMode must be used within a BusinessModeProvider");
  }
  return context;
}
