export default function isBase64(str: string) {
  try {
    return str.startsWith("data:image/");
  } catch (e) {
    return false;
  }
}
