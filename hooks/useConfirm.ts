import { MessageContext, MessageContextProps } from "@/context/MessageContext";
import { useContext } from "react";

export const useConfirm = (): ((
  config: Omit<MessageContextProps, "type">
) => void) => {
  const showConfirm = useContext(MessageContext);

  if (!showConfirm) {
    throw new Error("useConfirm must be used within a MessageProvider");
  }

  const showConfirmWithType = (config: Omit<MessageContextProps, "type">) => {
    showConfirm({ ...config, type: "confirm" });
  };

  return showConfirmWithType;
};

export default useConfirm;
