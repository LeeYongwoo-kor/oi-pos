import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";

type UseErrorType = {
  errorName: string | null;
  errorMessage?: string | null;
};
export type ErrorContextType = {
  error: UseErrorType | null;
  setError: Dispatch<SetStateAction<UseErrorType>>;
  clearError: () => void;
};
interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorContext = createContext<ErrorContextType | null>(null);

function useErrorContextValue() {
  const [error, setError] = useState<UseErrorType>({
    errorName: null,
    errorMessage: null,
  });

  const clearError = () => {
    if (typeof window === "undefined") {
      console.warn("clearError should not be used in a non-client environment");
    }
    setError({ errorName: null, errorMessage: null });
  };

  const value = {
    error,
    setError,
    clearError,
  };

  return value;
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const contextValue = useErrorContextValue();

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
}

export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);

  if (context === null) {
    throw new Error("useError must be used within an ErrorProvider");
  }

  return context;
};
