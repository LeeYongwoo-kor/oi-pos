import { ReactNode, createContext, useState } from "react";

export type NavigationContextType = {
  routeChanged: boolean;
  setRouteChanged: (state: boolean) => void;
};

export const NavigationContext = createContext<NavigationContextType>(
  {} as NavigationContextType
);

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [routeChanged, setRouteChanged] = useState(false);

  return (
    <NavigationContext.Provider value={{ routeChanged, setRouteChanged }}>
      {children}
    </NavigationContext.Provider>
  );
}
