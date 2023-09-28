import { useSetRecoilState } from "recoil";
import { messageState } from "../recoil/state/messageState";
import { useCallback } from "react";
import { UseMessageReturn } from "@/components/ui/Message";

export interface UseAlertReturn {
  showAlert: (
    config: Omit<
      UseMessageReturn,
      "type" | "isOpen" | "onConfirm" | "confirmText" | "placeholder"
    >
  ) => void;
}

export const useAlert = (): UseAlertReturn => {
  const setMessage = useSetRecoilState(messageState);

  const showAlert = useCallback(
    (
      config: Omit<
        UseMessageReturn,
        "type" | "isOpen" | "onConfirm" | "confirmText" | "placeholder"
      >
    ) => {
      if (typeof window === "undefined") {
        return;
      }
      setMessage({
        ...config,
        type: "alert",
        isOpen: true,
      });
    },
    []
  );

  return { showAlert };
};
