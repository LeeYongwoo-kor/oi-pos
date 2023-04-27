import { createContext, useState } from "react";

export type ErrorContextType = {
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
};

export const ErrorContext = createContext<ErrorContextType | null>(null);

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
