import { AWS_S3_YOSHI_BUCKET } from "@/constants/service";
import { createDemoMenus } from "@/database";
import awsS3CopyObject from "@/lib/server/awsS3CopyObject";
import awsS3Delete from "@/lib/server/awsS3Delete";
import withApiHandler from "@/lib/server/withApiHandler";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { NextApiRequest, NextApiResponse } from "next";

export interface IPostDemoMenuCategoryBody {
  restaurantId: string | null | undefined;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { restaurantId }: IPostDemoMenuCategoryBody = req.body;
  if (!restaurantId) {
    throw new ValidationError(
      "Failed to create demo menu. Please try again later"
    );
  }

  await awsS3CopyObject(`menus/${restaurantId}/`);
  try {
    const newDemoMenus = await createDemoMenus(restaurantId);
    return res.status(201).json(newDemoMenus);
  } catch (err) {
    await awsS3Delete({
      Bucket: AWS_S3_YOSHI_BUCKET,
      Key: `menus/${restaurantId}/`,
    });
    throw err;
  }
}

export default withApiHandler({
  methods: ["POST"],
  handler,
});
