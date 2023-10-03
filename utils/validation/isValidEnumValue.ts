export default function isValidEnumValue(
  value: string,
  enumObject: object
): boolean {
  return Object.values(enumObject).includes(value);
}
