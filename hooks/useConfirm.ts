import { useSetRecoilState } from "recoil";
import { messageState } from "../recoil/state/messageState";
import { useCallback } from "react";
import { UseMessageReturn } from "@/components/ui/Message";

export interface UseConfirmReturn {
  showConfirm: (
    config: Omit<UseMessageReturn, "type" | "isOpen" | "placeholder">
  ) => void;
}

export const useConfirm = (): UseConfirmReturn => {
  const setMessage = useSetRecoilState(messageState);

  const showConfirm = useCallback(
    (config: Omit<UseMessageReturn, "type" | "isOpen" | "placeholder">) => {
      if (typeof window === "undefined") {
        return;
      }
      setMessage({
        ...config,
        type: "confirm",
        isOpen: true,
      });
    },
    []
  );

  return { showConfirm };
};
