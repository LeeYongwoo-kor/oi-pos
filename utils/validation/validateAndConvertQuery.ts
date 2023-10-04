import { ValidationError } from "@/lib/shared/error/ApiError";
import isValidEnumValue from "./isValidEnumValue";
import isEmpty from "./isEmpty";

type QueryParameterDefinition = {
  type: "string" | "number" | "boolean" | "date" | { enum: object };
  required?: boolean;
};

type TypeDefinition<T> = {
  [key in keyof T]: QueryParameterDefinition;
};

function isEnumDefinition(type: any): type is { enum: object } {
  return typeof type === "object" && "enum" in type;
}

export default function validateAndConvertQuery<T>(
  query: Partial<{ [key: string]: string | string[] }>,
  typeDefinition: TypeDefinition<T>
): Partial<T> {
  const params: Partial<T> = {};

  for (const [key, { type, required }] of Object.entries(typeDefinition) as [
    string,
    QueryParameterDefinition
  ][]) {
    const value = query[key as keyof typeof query];
    if (
      (Array.isArray(value) && isEmpty(value)) ||
      (typeof value === "string" && value === "") ||
      value === null ||
      value === undefined
    ) {
      if (required) {
        // Send error to sentry
        console.error(`Missing query parameter: ${key}`);
        throw new ValidationError("Failed to fetch. Please try again");
      }
      continue;
    }

    if (type === "date" && typeof value === "string") {
      params[key as keyof T] = new Date(value) as any;
    } else if (isEnumDefinition(type) && isValidEnumValue(value, type.enum)) {
      params[key as keyof T] = Array.isArray(value) ? value : ([value] as any);
    } else if (type === "number" && !isNaN(Number(value))) {
      params[key as keyof T] = Number(value) as any;
    } else if (type === "boolean" && (value === "true" || value === "false")) {
      (params[key as keyof T] as any) = value === "true";
    } else if (type === "string" && typeof value === "string") {
      params[key as keyof T] = value as any;
    } else {
      // Send error to sentry
      console.error(`Invalid query parameter: ${key}`);
      throw new ValidationError("Failed to fetch. Please try again");
    }
  }

  return params;
}
