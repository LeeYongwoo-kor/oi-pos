import { Dispatch, SetStateAction, createContext, useState } from "react";

type UseErrorType = {
  errorName: string | null;
  errorMessage?: string | null;
};
export type ErrorContextType = {
  error: UseErrorType | null;
  setError: Dispatch<SetStateAction<UseErrorType>>;
  clearError: () => void;
};

export const ErrorContext = createContext<ErrorContextType | null>(null);

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<UseErrorType>({
    errorName: null,
    errorMessage: null,
  });

  const clearError = () => setError({ errorName: null, errorMessage: null });

  const value = {
    error,
    setError,
    clearError,
  };

  return (
    <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>
  );
}
