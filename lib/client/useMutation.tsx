import { useState } from "react";
import { useSWRConfig } from "swr";
import { CustomError } from "../shared/CustomError";
import { withErrorRetry } from "../server/withErrorRetry";

type ApiErrorState = {
  message: string;
  statusCode: number;
  redirectURL?: string;
};
type UseMutationState<T> = {
  loading: boolean;
  data?: T;
  error?: ApiErrorState | null;
};
type UseMutationResult<T, U> = [
  (data: U, options?: UseMutationOptions) => Promise<T>,
  UseMutationState<T>
];
type UseMutationOptions = {
  retry?: boolean;
  dynamicUrl?: string;
  isMutate?: boolean;
};

/**
 * Custom hook to make a mutation request to the server and handle the response
 * @category Client
 * @param {string} baseUrl - The base url of the request
 * @param {Exclude<Method, "GET">} method - The HTTP method of the request
 * @returns {UseMutationResult} - A tuple of the mutation function and the state of the request
 * @example
 * const [createUser, { loading, data, error }] =
 *  useMutation<User, UserInput>("/api/v1/users", "POST");
 * const handleCreateUser = async (data: UserInput) => {
 *  if (!loading) return;
 *  const { userId } = await getUser();
 *  const newUser = await createUser(
 *   { userId },
 *   { isMutate: true, retry: true, dynamicUrl: userId }
 *  );
 *  if (error) addToast("error", error.message) // ... handle error
 * }
 */
export default function useMutation<T = any, U = any>(
  baseUrl: string,
  method: Exclude<Method, "GET"> = "POST"
): UseMutationResult<T, U> {
  const { mutate } = useSWRConfig();
  const [state, setState] = useState<UseMutationState<T>>({
    loading: false,
    data: undefined,
    error: null,
  });

  const mutation = async (data: U, options: UseMutationOptions = {}) => {
    const { retry, dynamicUrl, isMutate = true } = options;
    const url = `${dynamicUrl ? baseUrl + "/" + dynamicUrl : baseUrl}`;
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

      if (isMutate) {
        mutate(url);
      }

      return responseData;
    } catch (err: any) {
      if (err instanceof CustomError) {
        setState((prev) => ({
          ...prev,
          error: { message: err.message, statusCode: err.statusCode },
        }));
      } else {
        console.error(err);
        setState((prev) => ({
          ...prev,
          error: { message: "Internal Server Error", statusCode: 500 },
        }));
      }
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  return [mutation, { ...state }];
}
