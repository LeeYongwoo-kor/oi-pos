export default function getNextImageUrl(
  url: string,
  viewportSize = 1080,
  quality = 75
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  return `${baseUrl}/_next/image?url=${encodeURIComponent(
    url
  )}&w=${viewportSize}&q=${quality}`;
}
