import {
  NavigationContext,
  NavigationContextType,
} from "@/providers/NavigationContext";
import { useContext } from "react";

/**
 * Custom hook to use the navigation context
 * @returns {NavigationContextType} The navigation context
 */
const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);

  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }

  return context;
};

export default useNavigation;
