import { CopyObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import s3 from "../services/awsS3";
import { ValidationError } from "../shared/error/ApiError";
import {
  AWS_S3_YOSHI_BUCKET,
  AWS_S3_YOSHI_DEMO_PREFIX,
} from "@/constants/service";

export default async function awsS3CopyObject(
  destinationPrefix: string | null
): Promise<void> {
  try {
    if (!destinationPrefix) {
      throw new ValidationError("Destination prefix is required");
    }

    // List all objects in the source folder
    const listObjectsCommand = new ListObjectsV2Command({
      Bucket: AWS_S3_YOSHI_BUCKET,
      Prefix: AWS_S3_YOSHI_DEMO_PREFIX,
    });
    const listObjectsResponse = await s3.send(listObjectsCommand);

    // Copy each object to the destination folder
    if (listObjectsResponse.Contents) {
      for (const object of listObjectsResponse.Contents) {
        if (object.Key) {
          const destinationKey = object.Key.replace(
            AWS_S3_YOSHI_DEMO_PREFIX,
            destinationPrefix
          );

          const copyObjectCommand = new CopyObjectCommand({
            Bucket: AWS_S3_YOSHI_BUCKET,
            CopySource: `${AWS_S3_YOSHI_BUCKET}/${object.Key}`,
            Key: destinationKey,
          });

          await s3.send(copyObjectCommand);
        }
      }
    }
  } catch (err) {
    // Send error to Sentry
    console.error(err);
    throw new ValidationError(
      "Failed to create demo menu. Please try again later"
    );
  }
}
