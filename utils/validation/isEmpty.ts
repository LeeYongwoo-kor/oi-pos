export default function isEmpty(
  input: Record<string, any> | any[] | null | undefined
) {
  if (Array.isArray(input)) {
    return input.length === 0;
  }
  return !input || Object.keys(input).length === 0;
}
