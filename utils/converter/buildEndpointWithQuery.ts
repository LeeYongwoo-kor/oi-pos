import objectToQueryString from "./objectToQueryString";

export default function buildEndpointWithQuery<T>(
  baseEndpoint: string,
  query: T | undefined
): string {
  const queryString = objectToQueryString<T>(query);
  return queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
}
