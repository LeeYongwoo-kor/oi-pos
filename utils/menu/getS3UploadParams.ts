import { PICTURE_CROP_MIN_SIZE } from "@/constants/menu";
import {
  AWS_S3_PUT_OBJECT_CACHE_CONTROL,
  AWS_S3_YOSHI_BUCKET,
} from "@/constants/service";
import { ApiError, ValidationError } from "@/lib/shared/error/ApiError";
import { PutObjectCommandInput } from "@aws-sdk/client-s3";

export default async function getS3UploadParams(
  croppedImage: Blob | null,
  imageKey: string,
  shouldUploadImage: () => boolean
): Promise<PutObjectCommandInput | null | ApiError> {
  try {
    if (!shouldUploadImage()) {
      return null;
    }

    if (!croppedImage || croppedImage.size <= PICTURE_CROP_MIN_SIZE) {
      return null;
    }

    const arrayBuffer = await croppedImage.arrayBuffer();
    const croppedImageBuffer = Buffer.from(arrayBuffer);

    return {
      Bucket: AWS_S3_YOSHI_BUCKET,
      Key: imageKey,
      Body: croppedImageBuffer,
      ContentType: croppedImage.type,
      CacheControl: AWS_S3_PUT_OBJECT_CACHE_CONTROL,
      ContentLength: croppedImage.size,
    };
  } catch (err) {
    // Send error to Sentry
    console.error(err);
    return new ValidationError(
      "Error occurred while uploading image. Please try again later"
    );
  }
}
