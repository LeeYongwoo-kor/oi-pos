export default function convertDatesToISOString<T extends Record<string, any>>(
  obj: T
): T {
  const convertedObj: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null) {
      if (value instanceof Date) {
        convertedObj[key] = value.toISOString();
      } else {
        convertedObj[key] = convertDatesToISOString(value);
      }
    } else {
      convertedObj[key] = value;
    }
  }

  return convertedObj as T;
}
