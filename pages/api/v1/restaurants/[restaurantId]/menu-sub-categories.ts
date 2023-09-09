import { Method } from "@/constants/fetch";
import {
  createMenuSubCategory,
  deleteMenuSubCategory,
  updateMenuSubCategory,
} from "@/database/menuSubCategory";
import withApiHandler from "@/lib/server/withApiHandler";
import { UnexpectedError, ValidationError } from "@/lib/shared/error/ApiError";
import { NextApiRequest, NextApiResponse } from "next";

export interface IPostMenuSubCategoryBody {
  id?: string;
  categoryId: string;
  name: string;
}
export interface IPatchMenuSubCategoryBody {
  menuSubCategoryId: string;
  name: string;
}
export interface IDeleteMenuSubCategoryBody {
  menuSubCategoryId: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === Method.POST) {
    const { id, categoryId, name }: IPostMenuSubCategoryBody = req.body;
    if (!categoryId || !name) {
      throw new ValidationError(
        "Failed to create menu sub category. Please try again later"
      );
    }

    const newMenuSubCategory = await createMenuSubCategory({
      id,
      categoryId,
      name,
    });
    return res.status(201).json(newMenuSubCategory);
  }

  if (req.method === Method.PATCH) {
    const { menuSubCategoryId, name }: IPatchMenuSubCategoryBody = req.body;
    if (!menuSubCategoryId || !name) {
      throw new ValidationError(
        "Failed to update menu sub category. Please try again later"
      );
    }

    const menuSubCategories = await updateMenuSubCategory(menuSubCategoryId, {
      name,
    });
    return res.status(200).json(menuSubCategories);
  }

  if (req.method === Method.DELETE) {
    const { menuSubCategoryId }: IDeleteMenuSubCategoryBody = req.body;
    if (!menuSubCategoryId) {
      throw new UnexpectedError(
        "Error occurred while deleting menu sub category"
      );
    }

    const deletedMenuSubCategory = await deleteMenuSubCategory(
      menuSubCategoryId
    );
    return res.status(200).json(deletedMenuSubCategory);
  }
}

export default withApiHandler({
  methods: ["POST", "PATCH", "DELETE"],
  handler,
});
