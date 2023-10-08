import isEmpty from "../validation/isEmpty";

export default function objectToQueryString<T>(obj: T | undefined): string {
  if (!obj || isEmpty(obj) || typeof obj !== "object") {
    return "";
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(obj)) {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && isEmpty(value))
    ) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, String(item)));
    } else if (value instanceof Date) {
      if (value.toString() === "Invalid Date") {
        continue;
      }
      params.append(key, value.toISOString());
    } else {
      params.append(key, String(value));
    }
  }

  return params.toString();
}
