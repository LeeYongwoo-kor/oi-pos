import { HeadBucketCommand } from "@aws-sdk/client-s3";
import s3, { AWS_S3_YOSHI_BUCKET } from "../services/awsS3";
import { ServiceUnavailableError } from "../shared/error/ApiError";

export default async function awsS3BucketCheck(): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: AWS_S3_YOSHI_BUCKET }));
  } catch (err) {
    // Send error to Sentry
    console.error(err);
    throw new ServiceUnavailableError(
      "Server has not been configured to receive file uploads. Please try again later"
    );
  }
}
