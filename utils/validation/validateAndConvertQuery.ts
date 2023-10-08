import { ValidationError } from "@/lib/shared/error/ApiError";
import isValidEnumValue from "./isValidEnumValue";
import isEmpty from "./isEmpty";
import { TableType } from "@prisma/client";

type QueryParameterDefinitionType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | { enum: object };

type QueryParameterDefinition = {
  type: QueryParameterDefinitionType;
  required?: boolean;
};

type TypeDefinition<T> = {
  [key in keyof T]: QueryParameterDefinition;
};

function isEnumDefinition(type: any): type is { enum: object } {
  return typeof type === "object" && "enum" in type;
}

function validateValue(
  key: string,
  value: any,
  type: QueryParameterDefinitionType,
  required: boolean
): boolean {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && isEmpty(value))
  ) {
    if (required) {
      // Send error to sentry
      console.error(`Missing query parameter: ${key}`);
      return false;
    }
    return true;
  }

  if (isEnumDefinition(type)) {
    return isValidEnumValue(value, type.enum);
  }

  switch (type) {
    case "string":
      return typeof value === "string";
    case "number":
      return !isNaN(Number(value));
    case "boolean":
      return value === "true" || value === "false";
    case "date":
      return !isNaN(new Date(value).getTime());
    default:
      return false;
  }
}

function convertValue(
  value: any,
  type: QueryParameterDefinitionType
): string | string[] | number | boolean | Date | null {
  if (isEnumDefinition(type)) {
    if (value === TableType.COUNTER || value === TableType.TABLE) {
      return value;
    }

    return Array.isArray(value) ? value : [value];
  }

  switch (type) {
    case "string":
      return value;
    case "number":
      return Number(value);
    case "boolean":
      return value === "true";
    case "date":
      return new Date(value);
    default:
      // Send error to sentry
      console.error(`Invalid query parameter: ${value}`);
      throw new ValidationError("Failed to fetch. Please try again");
  }
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
    const value = query[key];

    if (!validateValue(key, value, type, Boolean(required))) {
      throw new ValidationError("Failed to fetch. Please try again");
    }

    if (
      (value !== null && value !== undefined) ||
      (Array.isArray(value) && !isEmpty(value))
    ) {
      params[key as keyof T] = convertValue(value, type) as any;
    }
  }

  return params;
}
