import { ToastKind } from "@/components/ui/Toast";
import { ToastType } from "@/components/ui/Toast";
import { ReactNode, createContext, useState } from "react";
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

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const addToast = (type: ToastKind, message: string) => {
    const id = uuidv4();
    setToasts((prevToasts) => [...prevToasts, { id, type, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}
