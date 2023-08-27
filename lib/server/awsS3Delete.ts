import {
  DeleteObjectCommand,
  DeleteObjectCommandInput,
} from "@aws-sdk/client-s3";
import s3 from "../services/awsS3";
import { ValidationError } from "../shared/error/ApiError";
import awsS3BucketCheck from "./awsS3BucketCheck";

export default async function awsS3Delete(
  deleteParams: DeleteObjectCommandInput | null
): Promise<void> {
  // Check if bucket exists
  await awsS3BucketCheck();
  try {
    if (!deleteParams) {
      throw new ValidationError("Delete params are required");
    }

    // Delete object from S3
    await s3.send(new DeleteObjectCommand(deleteParams));
  } catch (err) {
    // Send error to Sentry
    console.error(err);
    throw new ValidationError("Failed to delete image. Please try again later");
  }
}
