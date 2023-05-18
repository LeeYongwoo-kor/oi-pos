export const Method = {
  GET: "GET",
  POST: "POST",
  DELETE: "DELETE",
  PATCH: "PATCH",
  PUT: "PUT",
} as const;

export type RequestMethodType = keyof typeof Method;
