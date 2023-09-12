import isDeepEqual from "@/utils/validation/isDeepEqual";
import { useEffect, useRef } from "react";

export default function useDeepEffect(
  callback: () => void,
  dependencies: any[]
) {
  const prevDepsRef = useRef<any[]>([]);

  const hasChanged = dependencies.some(
    (dep, i) => !isDeepEqual(dep, prevDepsRef.current[i])
  );

  useEffect(() => {
    if (hasChanged) {
      callback();
    }
    prevDepsRef.current = dependencies;
  }, [dependencies]); // eslint-disable-line react-hooks/exhaustive-deps
}
