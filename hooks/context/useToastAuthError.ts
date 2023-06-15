import { useError } from "@/providers/ErrorContext";
import { useToast } from "../useToast";

const useToastAuthError = (): ((errorMessage: string) => void) => {
  const { clearError } = useError();
  const { addToast } = useToast();

  return (errorMessage: string) => {
    if (errorMessage) {
      addToast("error", errorMessage);
      clearError();
    }
  };
};

export default useToastAuthError;
