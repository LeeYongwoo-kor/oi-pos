import { TOAST_MESSAGE_CLOSE_DELAY } from "@/constants";
import { useToast } from "@/hooks/useToast";
import { joinCls } from "@/utils/cssHelper";
import React, { useEffect } from "react";

export type ToastKind = "preserve" | "error" | "success" | "info";

export type ToastType = {
  id: string;
  type: ToastKind;
  message: string;
};

interface ToastProps extends ToastType {
  onDismiss: (id: string) => void;
}

const Toast = ({ id, type, message, onDismiss }: ToastProps) => {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (type !== "preserve") {
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
    type === "error"
      ? "bg-red-600"
      : type === "success"
      ? "bg-green-600"
      : type === "info"
      ? "bg-blue-600"
      : "bg-white";

  return (
    <div
      className={`flex animate-fadeInUp mt-4 p-4 shadow-lg rounded-lg ${bgColor} w-96 h-20 z-50 transform transition-all duration-300 translate-y-0`}
    >
      <div className="flex items-center justify-between">
        <span
          className={joinCls(
            "text-base",
            type === "preserve" ? "text-black" : "text-white"
          )}
        >
          {message}
        </span>
        {type === "preserve" && (
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
    <div className="fixed z-10 flex flex-col-reverse bottom-8 right-8">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}

export default React.memo(ToastContainer);
