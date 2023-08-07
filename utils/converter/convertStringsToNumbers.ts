export default function convertStringsToNumbers(
  obj: Record<string, any>
): Record<string, any> {
  const newObj: Record<string, any> = {};
  for (const [key, _] of Object.entries(obj)) {
    newObj[key] = isNaN(obj[key]) ? 0 : Number(obj[key]);
  }
  return newObj;
}
