import { useCallback, useState } from "react";
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
  isMutate?: boolean;
  additionalKeys?: string[];
};
type UseMutationOptionsOptimistic = UseMutationOptionBase & {
  isRevalidate?: false;
  optimisticData?: any;
};
type UseMutationOptionsRevalidate = UseMutationOptionBase & {
  isRevalidate: true;
};
export type UseMutationOptions =
  | UseMutationOptionsRevalidate
  | UseMutationOptionsOptimistic;

const handleOptions = (options: UseMutationOptions) => {
  const mutateOptions: UseMutationOptionsRevalidate = {
    retry: false,
    dynamicUrl: "",
    headers: {},
    isMutate: true,
    isRevalidate: true,
    additionalKeys: [],
  };

  if (options.isRevalidate === false) {
    return {
      ...mutateOptions,
      ...options,
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
  baseUrl: string | undefined | null,
  method: Exclude<Method, "GET"> = "POST"
): UseMutationResult<T, U> {
  const { mutate } = useSWRConfig();
  const [state, setState] = useState<UseMutationState<T>>({
    loading: false,
    data: undefined,
    error: null,
  });

  const mutation = useCallback(
    async (data: U, options: UseMutationOptions = { isRevalidate: true }) => {
      if (!baseUrl) {
        return;
      }

      const {
        retry,
        dynamicUrl,
        isRevalidate,
        isMutate,
        headers,
        additionalKeys,
        optimisticData,
      } = handleOptions(options);

      const url = `${dynamicUrl ? baseUrl + "/" + dynamicUrl : baseUrl}`;

      setState((prev) => ({ ...prev, loading: true }));
      try {
        const fetchData = async () => {
          if (!isEmpty(optimisticData)) {
            const optimisticOption = {
              optimisticData,
              rollbackOnError: true,
              populateCache: true,
              revalidate: false,
            };
            await Promise.all([
              isMutate ? mutate(url, optimisticData, optimisticOption) : [],
              ...(additionalKeys?.map((key: string) =>
                mutate(key, optimisticData, optimisticOption)
              ) || []),
            ]);
          }

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
          return await response.json();
        };

        const fetchDataWithRetry = retry
          ? withErrorRetry(fetchData)
          : fetchData;
        const responseData = await fetchDataWithRetry();

        if (isRevalidate || isEmpty(optimisticData)) {
          await Promise.all([
            isMutate ? mutate(url) : [],
            ...(additionalKeys?.map((key: string) => mutate(key)) || []),
          ]);
        }

        setState({ loading: false, data: responseData, error: null });
        return responseData;
      } catch (err: unknown) {
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
    },
    [baseUrl, method, mutate]
  );

  return [mutation, { ...state }];
}
