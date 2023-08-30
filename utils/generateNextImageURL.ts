import { ValidationError } from "@/lib/shared/error/ApiError";
import isBase64 from "./validation/isBase64";
import isURL from "./validation/isURL";

export default function generateNextImageURL(
  image: HTMLImageElement,
  imageSrc: string,
  viewportSize?: number,
  quality?: number
): void {
  if (isBase64(imageSrc)) {
    image.crossOrigin = "anonymous";
    image.src = imageSrc;
  } else if (isURL(imageSrc)) {
    image.src = `${
      process.env.NEXT_PUBLIC_BASE_URL
    }/_next/image?url=${encodeURIComponent(imageSrc)}&w=${
      viewportSize || 1080
    }&q=${quality || 75}`;
  } else {
    throw new ValidationError("Invalid image source");
  }
}
