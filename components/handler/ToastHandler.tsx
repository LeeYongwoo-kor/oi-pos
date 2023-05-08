import { ToastContext } from "@/context/ToastContext";
import useNavigation from "@/hooks/useNavigation";
import { useContext, useEffect } from "react";

const ToastHandler = () => {
  const toastContext = useContext(ToastContext);
  const { routeChanged, toastMessage, toastKind, resetToastMessage } =
    useNavigation();

  useEffect(() => {
    if (routeChanged && toastMessage && toastContext) {
      toastContext.addToast(toastKind, toastMessage);
      resetToastMessage();
    }
  }, [resetToastMessage, routeChanged, toastContext, toastKind, toastMessage]);

  return null;
};

export default ToastHandler;
