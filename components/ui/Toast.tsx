import { ToastKind } from "@/constants/message/toast";
import { TOAST_MESSAGE_CLOSE_DELAY } from "@/constants/numeric";
import { useToast } from "@/hooks/useToast";
import { joinCls } from "@/utils/cssHelper";
import React, { useEffect } from "react";

export type ToastSizeType = "small" | "big";
export type ToastKindType = (typeof ToastKind)[keyof typeof ToastKind];
export type ToastType = {
  id: string;
  type: ToastKindType;
  message: string;
  size?: ToastSizeType;
};

interface ToastProps extends ToastType {
  onDismiss: (id: string) => void;
}

const Toast = ({
  id,
  type,
  message,
  onDismiss,
  size = "small",
}: ToastProps) => {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (type !== ToastKind.PRESERVE) {
      timeoutId = setTimeout(() => {
        onDismiss(id);
      }, TOAST_MESSAGE_CLOSE_DELAY);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [type, id, onDismiss]);

  const bgColor =
    type === ToastKind.ERROR
      ? "bg-red-600"
      : type === "success"
      ? "bg-green-600"
      : type === "info"
      ? "bg-blue-600"
      : "bg-white";

  return (
    <div
      className={`flex self-end animate-fadeInUp w-full bg-opacity-90 justify-center mt-4 p-4 shadow-lg rounded-lg ${bgColor} ${
        size === "big" ? "sm:w-172" : "sm:w-96"
      } min-h-[4rem] sm:min-h-[5rem] h-auto z-50 transform transition-all duration-300 translate-y-0`}
    >
      <div className="flex items-center justify-between w-full">
        <span
          className={joinCls(
            "text-sm sm:text-base break-all whitespace-pre-line",
            type === ToastKind.PRESERVE ? "text-black" : "text-white"
          )}
        >
          {message}
        </span>
        {type === ToastKind.PRESERVE && (
          <button onClick={() => onDismiss(id)} className="text-xl font-bold">
            &times;
          </button>
        )}
      </div>
    </div>
  );
};

function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="fixed z-50 flex flex-col-reverse w-full px-2 bottom-12 sm:bottom-8 sm:right-6">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}

export default React.memo(ToastContainer);
