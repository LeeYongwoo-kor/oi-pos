import { ErrorContext, ErrorContextType } from "@/providers/ErrorContext";
import { useContext, useEffect, useState } from "react";

const useError = (): ErrorContextType => {
  const [isClient, setIsClient] = useState(false);
  const context = useContext(ErrorContext);

  useEffect(() => {
    setIsClient(typeof window !== "undefined");
  }, []);

  if (!isClient) {
    return {
      error: null,
      setError: () => {
        console.warn("setError should not be used in a non-client environment");
      },
      clearError: () => {
        console.warn(
          "clearError should not be used in a non-client environment"
        );
      },
    };
  }

  if (context === null) {
    throw new Error("useError must be used within an ErrorProvider");
  }

  return context;
};

export default useError;
