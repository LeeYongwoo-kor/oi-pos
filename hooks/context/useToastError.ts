import { useError } from "@/providers/ErrorContext";
import { useToast } from "@/providers/ToastContext";

const useToastError = (): ((errorMessage: string) => void) => {
  const { clearError } = useError();
  const { addToast } = useToast();

  return (errorMessage: string) => {
    if (errorMessage) {
      addToast("error", errorMessage);
      clearError();
    }
  };
};

export default useToastError;
