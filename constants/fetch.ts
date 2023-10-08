export const Method = {
  GET: "GET",
  POST: "POST",
  DELETE: "DELETE",
  PATCH: "PATCH",
  PUT: "PUT",
} as const;

export type RequestMethodType = keyof typeof Method;

export const ALARM_ORDER_REQUEST_LIMIT = 5;
