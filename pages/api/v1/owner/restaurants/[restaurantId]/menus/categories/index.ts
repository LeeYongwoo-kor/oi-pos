import { Method } from "@/constants/fetch";
import {
  CreateMenuCategoryParams,
  UpdateMenuCategoryParams,
  createMenuCategory,
  createMenuCategoryAndCategoryOptions,
  deleteMenuCategory,
  updateMenuCategory,
  updateMenuCategoryAndUpsertCategoryOptions,
} from "@/database";
import awsS3Delete from "@/lib/server/aws/awsS3Delete";
import awsS3Upload from "@/lib/server/aws/awsS3Upload";
import withApiHandler from "@/lib/server/withApiHandler";
import { UnexpectedError, ValidationError } from "@/lib/shared/error/ApiError";
import { MenuOptionForm } from "@/utils/menu/validateMenuOptions";
import isEmpty from "@/utils/validation/isEmpty";
import {
  DeleteObjectCommandInput,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { NextApiRequest, NextApiResponse } from "next";

export interface IPostMenuCategoryBody {
  menuCategoryInfo: CreateMenuCategoryParams;
  menuCategoryOptions?: MenuOptionForm[];
  uploadParams?: PutObjectCommandInput | null;
}
export interface IPatchMenuCategoryBody {
  menuCategoryInfo: UpdateMenuCategoryParams;
  menuCategoryOptions?: MenuOptionForm[];
  uploadParams?: PutObjectCommandInput | null;
}
export interface IDeleteMenuCategoryBody {
  menuCategoryId: string;
  deleteParams?: DeleteObjectCommandInput | null;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === Method.POST) {
    const {
      menuCategoryInfo,
      menuCategoryOptions,
      uploadParams,
    }: IPostMenuCategoryBody = req.body;
    if (!menuCategoryInfo.name) {
      throw new ValidationError("Menu category name is required");
    }

    if (uploadParams) {
      await awsS3Upload(uploadParams);
    }

    try {
      if (menuCategoryOptions && !isEmpty(menuCategoryOptions)) {
        const newMenuCategoryWithOptions =
          await createMenuCategoryAndCategoryOptions(
            menuCategoryInfo,
            menuCategoryOptions
          );

        return res.status(201).json(newMenuCategoryWithOptions);
      }

      const newMenuCategory = await createMenuCategory(menuCategoryInfo);
      return res.status(201).json(newMenuCategory);
    } catch (err: unknown) {
      if (uploadParams) {
        const { Bucket, Key }: DeleteObjectCommandInput = uploadParams;
        await awsS3Delete({ Bucket, Key });
      }

      throw err;
    }
  }

  if (req.method === Method.PATCH) {
    const {
      menuCategoryInfo,
      menuCategoryOptions,
      uploadParams,
    }: IPatchMenuCategoryBody = req.body;
    if (!menuCategoryInfo.name) {
      throw new ValidationError("Menu category name is required");
    }

    if (uploadParams) {
      await awsS3Upload(uploadParams);
    }

    try {
      if (menuCategoryOptions && !isEmpty(menuCategoryOptions)) {
        const newMenuCategoryWithOptions =
          await updateMenuCategoryAndUpsertCategoryOptions(
            menuCategoryInfo,
            menuCategoryOptions
          );

        return res.status(200).json(newMenuCategoryWithOptions);
      }

      const menuCategories = await updateMenuCategory(
        menuCategoryInfo.id,
        menuCategoryInfo
      );
      return res.status(200).json(menuCategories);
    } catch (err) {
      if (uploadParams) {
        const { Bucket, Key }: DeleteObjectCommandInput = uploadParams;
        await awsS3Delete({ Bucket, Key });
      }

      throw err;
    }
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
  methods: ["POST", "PATCH", "DELETE"],
  handler,
});
