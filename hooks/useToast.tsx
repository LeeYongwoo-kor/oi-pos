import { ToastKind, ToastType } from "@/components/ui/Toast";
import { useCallback } from "react";
import { useRecoilState } from "recoil";
import { v4 as uuidv4 } from "uuid";
import { toastState } from "./state/toastState";

export interface UseToastReturn {
  toasts: ToastType[];
  addToast: (type: ToastKind, message: string) => void;
  dismissToast: (id: string) => void;
}

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useRecoilState<ToastType[]>(toastState);

  const addToast = useCallback((type: ToastKind, message: string) => {
    if (typeof window === "undefined") {
      return;
    }
    const id = uuidv4();
    setToasts((prevToasts) => [...prevToasts, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    if (typeof window === "undefined") {
      return;
    }
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
};
