import { useCallback, useRef } from "react";

export function useDebounce<T extends any[]>(
  callback: (...args: T) => void,
  delay: number
) {
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const dispatchDebounce = useCallback(
    (...args: T) => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      const newTimer = setTimeout(() => {
        callback(...args);
      }, delay);
      timer.current = newTimer;
    },
    [callback, delay]
  );

  return dispatchDebounce;
}
