import { ToastType } from "@/components/ui/Toast";
import { createContext, useContext, useState, ReactNode } from "react";

export interface ToastContextType {
  toasts: ToastType[];
  addToast: (type: "preserve" | "error" | "success", message: string) => void;
  dismissToast: (id: number) => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const addToast = (
    type: "preserve" | "error" | "success",
    message: string
  ) => {
    const id = Date.now();
    setToasts((prevToasts) => [...prevToasts, { id, type, message }]);
  };

  const dismissToast = (id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}
