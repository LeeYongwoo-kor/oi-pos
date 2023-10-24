import { Method } from "@/constants/fetch";
import {
  CreateMenuItemParams,
  UpdateMenuItemParams,
  createMenuItem,
  createMenuItemAndMenuOptions,
  deleteMenuItem,
  updateMenuItem,
  updateMenuItemAndUpsertItemOptions,
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

export interface IPostMenuItemBody {
  menuItemParams: CreateMenuItemParams;
  menuItemOptions?: MenuOptionForm[];
  uploadParams?: PutObjectCommandInput | null;
}
export interface IPatchMenuItemBody {
  menuItemParams: UpdateMenuItemParams;
  menuItemOptions?: MenuOptionForm[];
  uploadParams?: PutObjectCommandInput | null;
}
export interface IDeleteMenuItemBody {
  menuItemId: string;
  deleteParams?: DeleteObjectCommandInput | null;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === Method.POST) {
    const { menuItemParams, menuItemOptions, uploadParams }: IPostMenuItemBody =
      req.body;
    if (!menuItemParams.name) {
      throw new ValidationError("Menu name is required");
    }
    if (!menuItemParams.price) {
      throw new ValidationError("Menu price is required");
    }

    if (uploadParams) {
      await awsS3Upload(uploadParams);
    }

    try {
      if (menuItemOptions && !isEmpty(menuItemOptions)) {
        const newMenuItemWithOptions = await createMenuItemAndMenuOptions(
          menuItemParams,
          menuItemOptions
        );

        return res.status(201).json(newMenuItemWithOptions);
      }

      const newMenuItem = await createMenuItem(menuItemParams);
      return res.status(201).json(newMenuItem);
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
      menuItemParams,
      menuItemOptions,
      uploadParams,
    }: IPatchMenuItemBody = req.body;
    if (!menuItemParams.name) {
      throw new ValidationError("Menu name is required");
    }
    if (!menuItemParams.price) {
      throw new ValidationError("Menu price is required");
    }

    if (uploadParams) {
      await awsS3Upload(uploadParams);
    }

    try {
      if (menuItemOptions && !isEmpty(menuItemOptions)) {
        const newMenuItemWithOptions = await updateMenuItemAndUpsertItemOptions(
          menuItemParams,
          menuItemOptions
        );

        return res.status(200).json(newMenuItemWithOptions);
      }
    } catch (err: unknown) {
      if (uploadParams) {
        const { Bucket, Key }: DeleteObjectCommandInput = uploadParams;
        await awsS3Delete({ Bucket, Key });
      }

      throw err;
    }

    const menuItems = await updateMenuItem(menuItemParams.id, menuItemParams);
    return res.status(200).json(menuItems);
  }

  if (req.method === Method.DELETE) {
    const { menuItemId, deleteParams }: IDeleteMenuItemBody = req.body;
    if (!menuItemId) {
      throw new UnexpectedError("Error occurred while deleting menu item");
    }

    if (deleteParams) {
      await awsS3Delete(deleteParams);
    }

    const deletedMenuItem = await deleteMenuItem(menuItemId);
    return res.status(200).json(deletedMenuItem);
  }
}

export default withApiHandler({
  methods: ["POST", "PATCH", "DELETE"],
  handler,
});
