import { ToastContext, ToastContextType } from "@/providers/ToastContext";
import { useContext, useEffect, useState } from "react";

const useToast = (): ToastContextType => {
  const [isClient, setIsClient] = useState(false);
  const context = useContext(ToastContext);

  useEffect(() => {
    setIsClient(typeof window !== "undefined");
  }, []);

  if (!isClient) {
    console.warn("addToast should not be used in a non-client environment");
  }

  if (context === null) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
};

export default useToast;
