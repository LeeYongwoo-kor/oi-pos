export default function convertDatesToISOString<
  T extends Record<string, any> | null
>(obj: T): T {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  const isArrayLike = Array.isArray(obj);
  const newObj: Record<string, any> = isArrayLike ? [...obj] : { ...obj };

  for (const [key, _] of Object.entries(newObj)) {
    if (newObj[key] instanceof Date) {
      newObj[key] = newObj[key].toISOString();
    } else if (Array.isArray(newObj[key])) {
      newObj[key] = [...newObj[key]].map((item: any) => {
        if (typeof item === "object" && item !== null) {
          return convertDatesToISOString(item);
        }
        return item;
      });
    } else if (typeof newObj[key] === "object" && newObj[key] !== null) {
      newObj[key] = convertDatesToISOString(newObj[key]);
    }
  }

  return newObj as T;
}
