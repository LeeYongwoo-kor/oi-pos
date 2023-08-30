import {
  CreateMenuCategoryParams,
  UpdateMenuCategoryParams,
  createMenuCategory,
  deleteMenuCategory,
  getAllCategoriesByRestaurantId,
  updateMenuCategory,
} from "@/database";
import awsS3Delete from "@/lib/server/awsS3Delete";
import awsS3Upload from "@/lib/server/awsS3Upload";
import withApiHandler from "@/lib/server/withApiHandler";
import { UnexpectedError, ValidationError } from "@/lib/shared/error/ApiError";
import {
  DeleteObjectCommandInput,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { NextApiRequest, NextApiResponse } from "next";

export interface IPostMenuCategoryBody {
  menuCategoryInfo: CreateMenuCategoryParams;
  uploadParams?: PutObjectCommandInput | null;
}
export interface IPatchMenuCategoryBody {
  menuCategoryInfo: UpdateMenuCategoryParams;
  uploadParams?: PutObjectCommandInput | null;
}
export interface IDeleteMenuCategoryBody {
  menuCategoryId: string;
  deleteParams?: DeleteObjectCommandInput | null;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { restaurantId } = req.query;
    if (typeof restaurantId !== "string") {
      throw new ValidationError("Invalid restaurantId type in query");
    }

    const allCategories = await getAllCategoriesByRestaurantId(restaurantId);
    return res.status(200).json(allCategories);
  }

  if (req.method === "POST") {
    const { menuCategoryInfo, uploadParams }: IPostMenuCategoryBody = req.body;
    if (!menuCategoryInfo.name) {
      throw new ValidationError("Menu category name is required");
    }

    if (uploadParams) {
      await awsS3Upload(uploadParams);
    }

    const newMenuCategory = await createMenuCategory(menuCategoryInfo);
    return res.status(201).json(newMenuCategory);
  }

  if (req.method === "PATCH") {
    const { menuCategoryInfo, uploadParams }: IPatchMenuCategoryBody = req.body;
    if (!menuCategoryInfo.name) {
      throw new ValidationError("Menu category name is required");
    }

    if (uploadParams) {
      await awsS3Upload(uploadParams);
    }

    const menuCategories = await updateMenuCategory(
      menuCategoryInfo.id,
      menuCategoryInfo
    );
    return res.status(200).json(menuCategories);
  }

  if (req.method === "DELETE") {
    const { menuCategoryId, deleteParams }: IDeleteMenuCategoryBody = req.body;
    if (!menuCategoryId) {
      throw new UnexpectedError("Error occurred while deleting menu category");
    }

    if (deleteParams) {
      await awsS3Delete(deleteParams);
    }

    const deletedMenuCategory = await deleteMenuCategory(menuCategoryId);
    return res.status(200).json(deletedMenuCategory);
  }
}

export default withApiHandler({
  methods: ["GET", "POST", "PATCH", "DELETE"],
  handler,
});
