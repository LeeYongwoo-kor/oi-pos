export default function checkNullUndefined(obj: Record<string, any>): {
  hasNullUndefined: boolean;
  nullOrUndefinedKeys: string;
} {
  const nullOrUndefinedKeys = Object.entries(obj)
    .filter(([_, value]) => value === null || value === undefined)
    .map(([key, _]) => key);

  if (nullOrUndefinedKeys.length > 0) {
    // send error to sentry
    console.error(`hasNullUndefined: ${nullOrUndefinedKeys.join(", ")}`);
  }

  return {
    hasNullUndefined: nullOrUndefinedKeys.length > 0,
    nullOrUndefinedKeys: nullOrUndefinedKeys.join(", "),
  };
}

export function hasNullUndefined(obj: Record<string, any>): boolean {
  return checkNullUndefined(obj).hasNullUndefined;
}
