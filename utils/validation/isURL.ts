import isBase64 from "./isBase64";

export default function isURL(str: string) {
  try {
    if (isBase64(str)) {
      return false;
    }
    new URL(str);
    return true;
  } catch (e) {
    return false;
  }
}
