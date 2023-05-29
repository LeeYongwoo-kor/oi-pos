import useError from "./useError";
import useToast from "./useToast";

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
