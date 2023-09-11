import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import s3 from "../../services/awsS3";
import { AWS_S3_YOSHI_BUCKET } from "@/constants/service";

export default async function awsS3CheckIfFolderExists(
  folderKey: string
): Promise<boolean> {
  const normalizedFolderKey = folderKey.endsWith("/")
    ? folderKey
    : `${folderKey}/`;

  const listObjectsCommand = new ListObjectsV2Command({
    Bucket: AWS_S3_YOSHI_BUCKET,
    Prefix: normalizedFolderKey,
    Delimiter: "/",
    MaxKeys: 1,
  });

  const listObjectsResponse = await s3.send(listObjectsCommand);
  return (listObjectsResponse.Contents?.length ?? 0) > 0;
}
