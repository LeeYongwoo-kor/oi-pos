import {
  MessageContext,
  MessageContextProps,
} from "@/providers/MessageContext";
import { useContext } from "react";

export const useConfirm = (): ((
  config: Omit<MessageContextProps, "type" | "isOpen">
) => void) => {
  const showConfirm = useContext(MessageContext);

  if (!showConfirm) {
    throw new Error("useConfirm must be used within a MessageProvider");
  }

  const showConfirmWithType = (
    config: Omit<MessageContextProps, "type" | "isOpen">
  ) => {
    showConfirm({ ...config, type: "confirm" });
  };

  return showConfirmWithType;
};

export default useConfirm;
