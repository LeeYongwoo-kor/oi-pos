import { ToastKindType } from "@/components/ui/Toast";
import { ReactNode, createContext, useContext, useState } from "react";

export type NavigationContextType = {
  toastMessage: string;
  toastKind: ToastKindType;
  showToastMessage: (type: ToastKindType, message: string) => void;
  hideToastMessage: () => void;
};

export const NavigationContext = createContext<NavigationContextType>(
  {} as NavigationContextType
);

interface NavigationProviderProps {
  children: ReactNode;
}

function useNavigationContextValue() {
  const [toastMessage, setToastMessage] = useState("");
  const [toastKind, setToastKind] = useState<ToastKindType>("info");

  const showToastMessage = (kind: ToastKindType, message: string) => {
    if (typeof window === "undefined") {
      console.warn(
        "showToastMessage should not be used in a non-client environment"
      );
      return;
    }
    setToastMessage(message);
    setToastKind(kind);
  };

  const hideToastMessage = () => {
    if (typeof window === "undefined") {
      console.warn(
        "hideToastMessage should not be used in a non-client environment"
      );
    }
    setToastMessage("");
  };

  return {
    toastMessage,
    toastKind,
    showToastMessage,
    hideToastMessage,
  };
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const contextValue = useNavigationContextValue();

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

/**
 * Custom hook to use the navigation context
 * @returns {NavigationContextType} The navigation context
 */
export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);

  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }

  return context;
};
