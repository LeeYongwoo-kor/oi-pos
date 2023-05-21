import {
  MessageContext,
  MessageContextProps,
} from "@/providers/MessageContext";
import { useContext } from "react";

export const useAlert = (): ((
  config: Omit<MessageContextProps, "type" | "onConfirm" | "isOpen">
) => void) => {
  const showConfirm = useContext(MessageContext);

  if (!showConfirm) {
    throw new Error("useAlert must be used within a MessageProvider");
  }

  const showAlert = (
    config: Omit<MessageContextProps, "type" | "onConfirm" | "isOpen">
  ) => {
    showConfirm({ ...config, type: "alert" });
  };

  return showAlert;
};

export default useAlert;
