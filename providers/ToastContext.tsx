import { ToastKind } from "@/components/ui/Toast";
import { ToastType } from "@/components/ui/Toast";
import { ReactNode, createContext, useContext, useState } from "react";
import { v4 as uuidv4 } from "uuid";
export interface ToastContextType {
  toasts: ToastType[];
  addToast: (type: ToastKind, message: string) => void;
  dismissToast: (id: string) => void;
}

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastContext = createContext<ToastContextType | null>(null);

function useToastContextValue() {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const addToast = (type: ToastKind, message: string) => {
    if (typeof window === "undefined") {
      console.warn("addToast should not be used in a non-client environment");
      return;
    }
    const id = uuidv4();
    setToasts((prevToasts) => [...prevToasts, { id, type, message }]);
  };

  const dismissToast = (id: string) => {
    if (typeof window === "undefined") {
      console.warn(
        "dismissToast should not be used in a non-client environment"
      );
      return;
    }
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return { toasts, addToast, dismissToast };
}

export function ToastProvider({ children }: ToastProviderProps) {
  const contextValue = useToastContextValue();

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
};
