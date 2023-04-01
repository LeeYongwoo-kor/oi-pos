import { createContext, useContext, useState } from "react";

type ErrorContextType = {
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
};

const ErrorContext = createContext<ErrorContextType | null>(null);

export function useError(): ErrorContextType {
  const context = useContext(ErrorContext);
  if (context === null) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return context;
}

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null);

  const value = {
    error,
    setError,
  };

  return (
    <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>
  );
}
