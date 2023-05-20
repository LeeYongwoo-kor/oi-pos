import { ToastKind } from "@/components/ui/Toast";
import { ReactNode, createContext, useState } from "react";

export type NavigationContextType = {
  routeChanged: boolean;
  toastMessage: string;
  toastKind: ToastKind;
  setToastMessage: (type: ToastKind, message: string) => void;
  resetToastMessage: () => void;
};

export const NavigationContext = createContext<NavigationContextType>(
  {} as NavigationContextType
);

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [routeChanged, setRouteChanged] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastKind, setToastKind] = useState<ToastKind>("info");

  const updateToastMessage = (kind: ToastKind, message: string) => {
    setToastMessage(message);
    setToastKind(kind);
    setRouteChanged(true);
  };

  const resetToastMessage = () => {
    setToastMessage("");
    setRouteChanged(false);
  };

  return (
    <NavigationContext.Provider
      value={{
        routeChanged,
        toastMessage,
        toastKind,
        setToastMessage: updateToastMessage,
        resetToastMessage,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}
