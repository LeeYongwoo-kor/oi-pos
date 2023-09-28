import { useSetRecoilState } from "recoil";
import { messageState } from "../recoil/state/messageState";
import { useCallback } from "react";
import { UseMessageReturn } from "@/components/ui/Message";

export interface UsePromptReturn {
  showPrompt: (config: Omit<UseMessageReturn, "type" | "isOpen">) => void;
}

export const usePrompt = (): UsePromptReturn => {
  const setMessage = useSetRecoilState(messageState);

  const showPrompt = useCallback(
    (config: Omit<UseMessageReturn, "type" | "isOpen">) => {
      if (typeof window === "undefined") {
        return;
      }
      setMessage({
        ...config,
        type: "prompt",
        isOpen: true,
      });
    },
    []
  );

  return { showPrompt };
};
