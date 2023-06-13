import { useSetRecoilState } from "recoil";
import { messageState } from "./state/messageState";
import { useCallback } from "react";
import { UseMessageReturn } from "@/components/ui/Message";

export interface UseAlertReturn {
  showAlert: (
    config: Omit<UseMessageReturn, "type" | "isOpen" | "onConfirm">
  ) => void;
}

export const useAlert = (): UseAlertReturn => {
  const setMessage = useSetRecoilState(messageState);

  const showAlert = useCallback(
    (config: Omit<UseMessageReturn, "type" | "isOpen" | "onConfirm">) => {
      if (typeof window === "undefined") {
        return;
      }
      setMessage({ ...config, type: "alert", isOpen: true });
    },
    []
  );

  return { showAlert };
};
