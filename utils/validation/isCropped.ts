import { Crop } from "react-image-crop";

/**
 * 画像の切り抜き変更の判定
 *
 * @param renderedDimension
 * @param crop
 * @returns
 */
export default function isCropped(
  renderedDimension: { width: number; height: number },
  crop: Crop | undefined
): boolean {
  return (
    renderedDimension.width !== crop?.width ||
    renderedDimension.height !== crop?.height
  );
}
