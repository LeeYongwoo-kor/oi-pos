export default function isPositiveInteger(value: number | null | undefined) {
  if (
    value === null ||
    value === undefined ||
    isNaN(Number(value)) ||
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value <= 0
  ) {
    return false;
  }

  return true;
}
