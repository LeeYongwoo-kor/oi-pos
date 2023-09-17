import { URL_MAX_LENGTH } from "@/constants/numeric";
import { ValidationError } from "@/lib/shared/error/ApiError";
import isEmpty from "../validation/isEmpty";

const isUrlTooLong = (url: string, maxLength = URL_MAX_LENGTH) =>
  url.length > maxLength;

export default function createAndValidateEncodedUrl(
  object: any[],
  endpoint: string
): string | null {
  try {
    if (!object || isEmpty(object) || typeof object !== "object" || !endpoint) {
      return null;
    }

    const encodedObjects = encodeURIComponent(JSON.stringify(object));
    const fullUrl = `${endpoint}/${encodedObjects}`;

    if (isUrlTooLong(fullUrl)) {
      throw new ValidationError("URL is too long");
    }

    return fullUrl;
  } catch (err: unknown) {
    // Send error to Sentry
    console.error(err);
    if (err instanceof ValidationError) {
      throw err;
    }
    throw new ValidationError("Invalid object type");
  }
}
