import { PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import s3 from "../../services/awsS3";
import { ValidationError } from "../../shared/error/ApiError";
import awsS3BucketCheck from "./awsS3BucketCheck";

export default async function awsS3Upload(
  uploadParams: PutObjectCommandInput | null
): Promise<void> {
  // Check if bucket exists
  await awsS3BucketCheck();
  try {
    if (!uploadParams) {
      throw new ValidationError("Upload params is required");
    }

    // Upload image to S3
    await s3.send(new PutObjectCommand(uploadParams));
  } catch (err) {
    // Send error to Sentry
    console.error(err);
    throw new ValidationError("Failed to upload image. Please try again later");
  }
}
