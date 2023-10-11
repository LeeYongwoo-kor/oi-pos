import { ValidationError } from "@/lib/shared/error/ApiError";
import getNextImageUrl from "./getNextImageUrl";
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
    return;
  }

  if (isURL(imageSrc)) {
    image.src = getNextImageUrl(imageSrc, viewportSize, quality);
    return;
  }

  throw new ValidationError("Invalid image source");
}
