import { S3Client } from "@aws-sdk/client-s3";

export const AWS_S3_YOSHI_BUCKET = "yoshi-bucket";
export const AWS_S3_YOSHI_DEMO_PREFIX = "menus/yoshi-demo/";
export const AWS_S3_PUT_OBJECT_CACHE_CONTROL = "max-age=2592000";

const s3 = new S3Client({
  region: process.env.AWS_S3_BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_S3_SECRET_KEY!,
  },
});

export default s3;
