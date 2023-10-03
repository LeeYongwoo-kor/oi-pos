import isValidEnumValue from "./isValidEnumValue";

type TypeDefinition<T> = {
  [key in keyof T]: "string" | "number" | { enum: object };
};

export default function validateAndConvertQuery<T>(
  query: Partial<{ [key: string]: string | string[] }>,
  typeDefinition: TypeDefinition<T>
): Partial<T> {
  const params: Partial<T> = {};

  for (const [key, type] of Object.entries(typeDefinition)) {
    const value = query[key];
    if (value === undefined) {
      continue;
    }

    if (
      typeof type === "object" &&
      type!.enum &&
      isValidEnumValue(value, type!.enum)
    ) {
      params[key] = value;
    } else if (type === "number" && !isNaN(Number(value))) {
      params[key] = Number(value);
    } else if (type === "string") {
      params[key] = value;
    }
  }

  return params;
}
