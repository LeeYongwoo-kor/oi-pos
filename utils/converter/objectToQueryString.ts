import isEmpty from "../validation/isEmpty";

export default function objectToQueryString(
  obj: Record<string, any> | undefined
): string {
  if (!obj || isEmpty(obj) || typeof obj !== "object") {
    return "";
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, String(item)));
    } else if (value instanceof Date) {
      params.append(key, value.toISOString().split("T")[0]);
    } else {
      params.append(key, String(value));
    }
  }

  return params.toString();
}
