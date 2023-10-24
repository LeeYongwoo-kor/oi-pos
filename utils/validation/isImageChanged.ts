/**
 * 画像変更の判定
 *
 * @param previewUrl
 * @param imageUrl
 * @returns
 */
export default function isImageChanged(
  previewUrl: string | null,
  imageUrl: string
): boolean {
  return Boolean(previewUrl && !previewUrl.includes(imageUrl));
}
