export function hasNullUndefined(obj: Record<string, any>): boolean {
  return Object.values(obj).some(
    (value) => value === null || value === undefined
  );
}
