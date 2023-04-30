import { MessageContext, MessageContextProps } from "@/context/MessageContext";
import { useContext } from "react";

export const useAlert = (): ((
  config: Omit<MessageContextProps, "type" | "onConfirm">
) => void) => {
  const showConfirm = useContext(MessageContext);

  if (!showConfirm) {
    throw new Error("useAlert must be used within a MessageProvider");
  }

  const showAlert = (
    config: Omit<MessageContextProps, "type" | "onConfirm">
  ) => {
    showConfirm({ ...config, type: "alert" });
  };

  return showAlert;
};

export default useAlert;
