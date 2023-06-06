import { useNavigation } from "@/providers/NavigationContext";
import { ToastContext } from "@/providers/ToastContext";
import { useContext, useEffect } from "react";

const ToastHandler = () => {
  const toastContext = useContext(ToastContext);
  const { toastMessage, toastKind, hideToastMessage } = useNavigation();

  useEffect(() => {
    if (toastMessage && toastContext) {
      toastContext.addToast(toastKind, toastMessage);
      hideToastMessage();
    }
  }, [hideToastMessage, toastContext, toastKind, toastMessage]);

  return null;
};

export default ToastHandler;
