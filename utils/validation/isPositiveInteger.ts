export default function isPositiveInteger(value: number) {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return false;
  }

  return true;
}
