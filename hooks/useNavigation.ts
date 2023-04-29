import {
  NavigationContext,
  NavigationContextType,
} from "@/context/NavigationContext";
import { useContext } from "react";

const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);

  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }

  return context;
};

export default useNavigation;
