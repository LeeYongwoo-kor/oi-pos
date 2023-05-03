import Message from "@/components/ui/Message";
import { ReactNode, createContext, useState } from "react";

export type MessageContextProps = {
  title: string;
  message: string;
  isOpen?: boolean;
  type?: "alert" | "confirm";
  onConfirm?: () => void;
  onCancel?: () => void;
};

type MessageContextType = (config: MessageContextProps) => void;

interface MessageProviderProps {
  children: ReactNode;
}

export const MessageContext = createContext<MessageContextType | null>(null);

export function MessageProvider({ children }: MessageProviderProps) {
  const [loading, setLoading] = useState(false);
  const [messageConfig, setMessageConfig] = useState<MessageContextProps>({
    isOpen: false,
    title: "",
    message: "",
    type: "confirm",
  });

  const showConfirm = (config: MessageContextProps) => {
    setMessageConfig({ ...config, isOpen: true });
  };

  const handleConfirm = () => {
    setLoading(true);
    try {
      if (messageConfig.type === "confirm") {
        messageConfig.onConfirm?.();
      }
    } finally {
      setLoading(false);
      setMessageConfig({ ...messageConfig, isOpen: false });
    }
  };

  const handleCancel = () => {
    setLoading(true);
    try {
      messageConfig.onCancel?.();
    } finally {
      setLoading(false);
      setMessageConfig({ ...messageConfig, isOpen: false });
    }
  };

  return (
    <MessageContext.Provider value={showConfirm}>
      {children}
      <Message
        {...messageConfig}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        loading={loading}
      />
    </MessageContext.Provider>
  );
}
