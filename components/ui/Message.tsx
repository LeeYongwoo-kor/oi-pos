import { messageLoadingState, messageState } from "@/recoil/state/messageState";
import { joinCls } from "@/utils/cssHelper";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRecoilState, useRecoilValue, useResetRecoilState } from "recoil";

interface UseMessageButtonType {
  confirm: string;
  info: string;
  warn: string;
  fatal: string;
}

export interface UseMessageReturn {
  isOpen: boolean;
  title: string;
  message: string;
  type: "alert" | "confirm" | "prompt";
  buttonType?: keyof UseMessageButtonType;
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
  onConfirm?: (promptValue?: string) => void;
  onCancel?: () => void;
  onClose?: () => void;
}

interface MessageProps extends UseMessageReturn {
  loading: boolean;
  promptValue: string;
  promptErrorState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Message = ({
  title,
  message,
  type,
  isOpen,
  loading,
  buttonType,
  confirmText,
  cancelText,
  placeholder,
  promptValue,
  promptErrorState: [promptError, setPromptError],
  handleInputChange,
  onConfirm,
  onCancel,
  onClose,
}: MessageProps) => {
  const color: UseMessageButtonType = {
    confirm: "bg-green-500 hover:bg-green-600",
    info: "bg-blue-500 hover:bg-blue-600",
    warn: "bg-amber-500 hover:bg-amber-600",
    fatal: "bg-red-500 hover:bg-red-600",
  };
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleClickConfirm = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (type !== "prompt") {
      onConfirm?.();
      return;
    }

    if (!promptValue) {
      setPromptError(true);
      return;
    }

    onConfirm?.(promptValue);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dialogRef.current &&
      !dialogRef.current.contains(event.target as Node)
    ) {
      event.preventDefault();
      onClose?.();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div
        ref={dialogRef}
        className="z-50 w-full max-w-md p-6 mx-auto bg-white rounded shadow-lg"
      >
        <h2 className="mb-4 text-xl font-semibold">{title}</h2>
        <p className="mb-6 text-gray-600">{message}</p>
        {type === "prompt" && (
          <>
            {promptError && (
              <p className="text-xs text-red-500">
                メッセージを入力してください。
              </p>
            )}
            <div
              className={`flex items-center w-full h-8 mb-6 border ${
                promptError && "border-red-500"
              }`}
            >
              <input
                className="w-full font-medium cursor-text indent-2"
                type="text"
                placeholder={placeholder}
                value={promptValue}
                onChange={handleInputChange}
              />
            </div>
          </>
        )}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            disabled={loading}
            className={joinCls(
              "px-4 py-2 rounded cursor-pointer",
              type !== "alert"
                ? "text-gray-700 bg-gray-300 hover:bg-gray-400"
                : `text-white ${buttonType ? color[buttonType] : color.info}`
            )}
          >
            {cancelText || (type !== "alert" ? "Cancel" : "Close")}
          </button>
          {type !== "alert" && (
            <button
              onClick={handleClickConfirm}
              disabled={loading}
              className={`px-4 py-2 text-white rounded cursor-pointer ${
                buttonType ? color[buttonType] : color.confirm
              }`}
            >
              {confirmText || "Confirm"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function MessageContainer() {
  const messageConfig = useRecoilValue(messageState);
  const [loading, setLoading] = useRecoilState(messageLoadingState);
  const resetMessageState = useResetRecoilState(messageState);
  const [promptValue, setPromptValue] = useState<string>("");
  const [promptError, setPromptError] = useState(false);

  const resetState = useCallback(() => {
    setPromptValue("");
    setPromptError(false);
    resetMessageState();
    setLoading(false);
  }, []);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPromptValue(event.target.value);
    },
    []
  );

  const handleConfirm = () => {
    setLoading(true);
    try {
      if (messageConfig.type === "confirm") {
        messageConfig.onConfirm?.();
      }
      if (messageConfig.type === "prompt") {
        messageConfig.onConfirm?.(promptValue);
      }
    } finally {
      resetState();
    }
  };

  const handleCancel = () => {
    setLoading(true);
    try {
      messageConfig.onCancel?.();
    } finally {
      resetState();
    }
  };

  const handleOnClose = () => {
    setLoading(true);
    try {
      messageConfig.onClose?.();
    } finally {
      resetState();
    }
  };

  return (
    <Message
      {...messageConfig}
      loading={loading}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      onClose={handleOnClose}
      promptValue={promptValue}
      promptErrorState={[promptError, setPromptError]}
      handleInputChange={handleInputChange}
    />
  );
}

export default React.memo(MessageContainer);
