import LoadingOverlay from "@/components/LoadingOverlay";
import { loadingState } from "@/recoil/state/loadingState";
import React from "react";
import { useRecoilValue } from "recoil";

export type LoadingProviderProps = {
  children: React.ReactNode;
};

export const LoadingProvider = ({ children }: LoadingProviderProps) => {
  const loading = useRecoilValue(loadingState);

  return (
    <>
      {loading && <LoadingOverlay />}
      {children}
    </>
  );
};
