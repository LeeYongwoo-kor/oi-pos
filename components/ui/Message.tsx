import { messageLoadingState, messageState } from "@/hooks/state/messageState";
import { joinCls } from "@/utils/cssHelper";
import React from "react";
import { useRecoilState, useResetRecoilState } from "recoil";

export interface UseMessageReturn {
  isOpen: boolean;
  title: string;
  message: string;
  type: "alert" | "confirm";
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface MessageProps extends UseMessageReturn {
  loading: boolean;
}

const Message = ({
  title,
  message,
  type,
  isOpen,
  loading,
  onConfirm,
  onCancel,
}: MessageProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="z-50 w-full max-w-md p-6 mx-auto bg-white rounded shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">{title}</h2>
        <p className="mb-6 text-gray-600">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            disabled={loading}
            className={joinCls(
              "px-4 py-2 rounded",
              type === "confirm"
                ? "text-gray-700 bg-gray-300 hover:bg-gray-400"
                : "text-white bg-blue-500 hover:bg-blue-600"
            )}
          >
            {type === "confirm" ? "Cancel" : "Close"}
          </button>
          {type === "confirm" && (
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600"
            >
              Confirm
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function MessageContainer() {
  const [messageConfig, setMessageConfig] = useRecoilState(messageState);
  const [loading, setLoading] = useRecoilState(messageLoadingState);
  const resetMessageState = useResetRecoilState(messageState);

  const handleConfirm = () => {
    setLoading(true);
    try {
      if (messageConfig.type === "confirm") {
        messageConfig.onConfirm?.();
      }
    } finally {
      setLoading(false);
      resetMessageState();
    }
  };

  const handleCancel = () => {
    setLoading(true);
    try {
      messageConfig.onCancel?.();
    } finally {
      setLoading(false);
      resetMessageState();
    }
  };

  return (
    <Message
      {...messageConfig}
      loading={loading}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
}

export default React.memo(MessageContainer);
