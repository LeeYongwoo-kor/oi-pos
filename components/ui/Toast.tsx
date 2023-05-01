import { joinCls } from "@/lib/client/helper";
import { useEffect } from "react";

export type ToastType = {
  id: number;
  type: "preserve" | "error" | "success";
  message: string;
};

interface ToastProps extends ToastType {
  onDismiss: (id: number) => void;
}

const Toast = ({ id, type, message, onDismiss }: ToastProps) => {
  useEffect(() => {
    if (type !== "preserve") {
      setTimeout(() => {
        onDismiss(id);
      }, 5000);
    }
  }, [type, id, onDismiss]);

  const bgColor =
    type === "error"
      ? "bg-red-600"
      : type === "success"
      ? "bg-green-600"
      : "bg-white";

  return (
    <div
      className={`animate-fadeInUp mt-4 p-4 shadow-lg rounded-lg ${bgColor} w-96 h-16 z-50 transform transition-all duration-300 translate-y-0`}
    >
      <div className="flex items-center justify-between">
        <span
          className={joinCls(
            "text-lg",
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

export default Toast;
