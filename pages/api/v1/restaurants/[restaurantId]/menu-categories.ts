import { Method } from "@/constants/fetch";
import {
  CreateMenuCategoryParams,
  UpdateMenuCategoryParams,
  createMenuCategory,
  deleteMenuCategory,
  getAllCategoriesByRestaurantId,
  updateMenuCategory,
} from "@/database";
import awsS3CheckIfFolderExists from "@/lib/server/awsS3CheckIfFolderExists";
import awsS3Delete from "@/lib/server/awsS3Delete";
import awsS3Upload from "@/lib/server/awsS3Upload";
import withApiHandler from "@/lib/server/withApiHandler";
import {
  NotFoundError,
  UnexpectedError,
  ValidationError,
} from "@/lib/shared/error/ApiError";
import isEmpty from "@/utils/validation/isEmpty";
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
  if (req.method === Method.GET) {
    const { restaurantId } = req.query;
    if (typeof restaurantId !== "string") {
      throw new ValidationError("Invalid restaurantId type in query");
    }

    const allCategories = await getAllCategoriesByRestaurantId(restaurantId);
    if (!isEmpty(allCategories)) {
      const isExists = await awsS3CheckIfFolderExists(`menus/${restaurantId}/`);
      if (!isExists) {
        // TODO: Update Category Status to "Unavailable"
        throw new NotFoundError(
          "No found folders were found on Cloud Storage. Please try again or contact support for assistance"
        );
      }
    }

    return res.status(200).json(allCategories);
  }

  if (req.method === Method.POST) {
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

  if (req.method === Method.PATCH) {
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

  if (req.method === Method.DELETE) {
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
