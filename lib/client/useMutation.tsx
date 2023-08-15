import { useState } from "react";
import { useSWRConfig } from "swr";
import { ApiError, ApiErrorType } from "../shared/error/ApiError";
import { withErrorRetry } from "../shared/withErrorRetry";
import isEmpty from "@/utils/validation/isEmpty";

type ApiErrorState = {
  message: string;
  statusCode: number;
  redirectUrl?: string;
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
type UseMutationOptionBase = {
  retry?: boolean;
  dynamicUrl?: string;
  headers?: Record<string, string>;
};
type UseMutationOptionsMutate = UseMutationOptionBase & {
  isMutate?: true;
  additionalKeys?: string[];
  optimisticData?: any;
};
type UseMutationOptionsNonMutate = UseMutationOptionBase & {
  isMutate: false;
};
type UseMutationOptions =
  | UseMutationOptionsMutate
  | UseMutationOptionsNonMutate;

const handleOptions = (options: UseMutationOptions) => {
  const mutateOptions: UseMutationOptionsMutate = {
    retry: false,
    dynamicUrl: "",
    headers: {},
    isMutate: true,
    additionalKeys: [],
    optimisticData: null,
  };

  if (options.isMutate === false) {
    return {
      ...mutateOptions,
      ...options,
      additionalKeys: [],
      optimisticData: null,
    };
  }

  return {
    ...mutateOptions,
    ...options,
  };
};

/**
 * Custom hook to make a mutation request to the server and handle the response
 * @category Client
 * @param {string} baseUrl - The base url of the request
 * @param {Exclude<Method, "GET">} method - The HTTP method of the request
 * @returns {UseMutationResult} - A tuple of the mutation function and the state of the request
 * @objectParam {UseMutationOptions} options - The options for the mutation request
 * @example
 * const [createUser, { loading, data, error }] =
 *  useMutation<ReturnType, ArgumentType>("/api/v1/users", "POST");
 * const handleCreateUser = async (data: ArgumentType) => {
 *  if (!loading) return;
 *  const { userId } = await getUser();
 *  const newUser = await createUser(
 *   { userId },
 *   { isMutate: false, retry: true, dynamicUrl: userId }
 *  );
 *  if (error) addToast("error", error.message); // ... handle error
 * }
 */
export default function useMutation<T, U>(
  baseUrl: string,
  method: Exclude<Method, "GET"> = "POST"
): UseMutationResult<T, U> {
  const { mutate } = useSWRConfig();
  const [state, setState] = useState<UseMutationState<T>>({
    loading: false,
    data: undefined,
    error: null,
  });

  const mutation = async (
    data: U,
    options: UseMutationOptions = { isMutate: true }
  ) => {
    const {
      retry,
      dynamicUrl,
      isMutate,
      headers,
      additionalKeys,
      optimisticData,
    } = handleOptions(options);

    const url = `${dynamicUrl ? baseUrl + "/" + dynamicUrl : baseUrl}`;

    if (!isEmpty(optimisticData)) {
      mutate(url, optimisticData, false);
    }

    setState((prev) => ({ ...prev, loading: true }));
    try {
      const fetchData = async () => {
        const response = await fetch(url, {
          method,
          headers: {
            "Content-type": "application/json",
            ...headers,
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const errorData: ApiErrorType = await response.json();
          throw new ApiError(errorData.message, response.status);
        }
        return response.json();
      };

      const fetchDataWithRetry = retry ? withErrorRetry(fetchData) : fetchData;
      const responseData = await fetchDataWithRetry();

      if (isMutate) {
        await Promise.all([
          mutate(url, true),
          ...(additionalKeys?.map((key: string) => mutate(key)) || []),
        ]);
      }

      setState({ loading: false, data: responseData, error: null });
      return responseData;
    } catch (err: any) {
      let errorMessage = "Internal Server Error";
      let statusCode = 500;

      // TODO: send error to sentry
      console.error(err);
      console.error(`Error occurred on endpoint: ${url}`);
      if (err instanceof ApiError) {
        errorMessage = err.message;
        statusCode = err.statusCode || 500;
      }

      setState({
        loading: false,
        data: undefined,
        error: { message: errorMessage, statusCode },
      });
    }
  };

  return [mutation, { ...state }];
}
