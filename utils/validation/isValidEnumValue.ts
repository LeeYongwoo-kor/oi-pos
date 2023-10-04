import isEmpty from "./isEmpty";

export default function isValidEnumValue(
  value: string | string[],
  enumObject: object
): boolean {
  if (
    (Array.isArray(value) && isEmpty(value)) ||
    value === "" ||
    value === undefined
  ) {
    return false;
  }

  const enumValues = Object.values(enumObject);
  if (Array.isArray(value)) {
    return value.every((val) => enumValues.includes(val));
  }

  return enumValues.includes(value);
}
