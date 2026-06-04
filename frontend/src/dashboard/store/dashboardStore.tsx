import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type DashboardDensity = "compact" | "comfortable";

interface DashboardStore {
  density: DashboardDensity;
  setDensity: (density: DashboardDensity) => void;
}

const DashboardStoreContext = createContext<DashboardStore | null>(null);

export function DashboardStoreProvider({ children }: { children: ReactNode }) {
  const [density, setDensity] = useState<DashboardDensity>("compact");
  const value = useMemo(() => ({ density, setDensity }), [density]);
  return <DashboardStoreContext.Provider value={value}>{children}</DashboardStoreContext.Provider>;
}

export function useDashboardStore() {
  const context = useContext(DashboardStoreContext);
  if (!context) throw new Error("useDashboardStore must be used inside DashboardStoreProvider");
  return context;
}
