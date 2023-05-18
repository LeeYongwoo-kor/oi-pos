import { useState } from "react";
import { useSWRConfig } from "swr";
import { CustomError } from "../shared/CustomError";
import { withErrorRetry } from "../server/withErrorRetry";

type ApiErrorData = {
  message: string;
  redirectURL?: string;
};
interface UseMutationState<T> {
  loading: boolean;
  data?: T;
  error?: ApiErrorData | null;
}
type UseMutationResult<T, U> = [
  (data: U, options?: UseMutationOptions) => Promise<void>,
  UseMutationState<T>
];
type UseMutationOptions = {
  retry?: boolean;
};

export default function useMutation<T = any, U = any>(
  url: string,
  method: Exclude<Method, "GET"> = "POST"
): UseMutationResult<T, U> {
  const { mutate } = useSWRConfig();
  const [state, setState] = useState<UseMutationState<T>>({
    loading: false,
    data: undefined,
    error: null,
  });

  const mutation = async (data: U, options: UseMutationOptions = {}) => {
    const { retry } = options;
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const fetchData = async () => {
        const response = await fetch(url, {
          method,
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new CustomError(errorData.message, response.status);
        }
        return response.json();
      };

      const fetchDataWithRetry = retry ? withErrorRetry(fetchData) : fetchData;
      const responseData = await fetchDataWithRetry();
      setState((prev) => ({ ...prev, data: responseData }));
      mutate(url);
    } catch (error: any) {
      if (error instanceof CustomError) {
        setState((prev) => ({
          ...prev,
          error: { message: error.message },
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: { message: "Internal Server Error" },
        }));
      }
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  return [mutation, { ...state }];
}
