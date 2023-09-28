import { nanoid } from "nanoid";
import { ToastKindType, ToastSizeType, ToastType } from "@/components/ui/Toast";
import { useCallback } from "react";
import { useRecoilState } from "recoil";
import { toastState } from "../recoil/state/toastState";

export interface UseToastReturn {
  toasts: ToastType[];
  addToast: (
    type: ToastKindType,
    message: string,
    size?: ToastSizeType
  ) => void;
  dismissToast: (id: string) => void;
}

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useRecoilState<ToastType[]>(toastState);

  const addToast = useCallback(
    (type: ToastKindType, message: string, size?: ToastSizeType) => {
      if (typeof window === "undefined") {
        return;
      }
      const id = nanoid();
      setToasts((prevToasts) => [...prevToasts, { id, type, message, size }]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    if (typeof window === "undefined") {
      return;
    }
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
};
