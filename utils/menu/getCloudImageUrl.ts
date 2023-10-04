export default function getCloudImageUrl(
  imageUrl: string | null | undefined,
  imageVersion: number | undefined
): string {
  if (!imageUrl) {
    // TODO: Replace with default image
    return "";
  }

  return `${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${imageUrl}?v=${
    imageVersion || 0
  }`;
}
