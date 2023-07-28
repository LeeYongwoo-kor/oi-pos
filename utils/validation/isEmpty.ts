export default function isEmpty(obj: Record<string, any> | null | undefined) {
  return !obj || Object.keys(obj).length === 0;
}
