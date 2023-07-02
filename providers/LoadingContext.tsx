import React, { createContext, useState, useContext } from "react";

const LoadingContext = createContext<
  [boolean, React.Dispatch<React.SetStateAction<boolean>>]
>([false, () => {}]);

type LoadingProviderProps = {
  children: React.ReactNode;
};

export const LoadingProvider: React.FC<LoadingProviderProps> = ({
  children,
}) => {
  const state = useState(false);
  return (
    <LoadingContext.Provider value={state}>{children}</LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
