import {
  CreateMenuCategoryParams,
  UpdateMenuCategoryParams,
  getAllCategoriesByRestaurantId,
  getTopSellingItems,
} from "@/database";
import awsS3CheckIfFolderExists from "@/lib/server/aws/awsS3CheckIfFolderExists";
import withApiHandler from "@/lib/server/withApiHandler";
import { NotFoundError, ValidationError } from "@/lib/shared/error/ApiError";
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
  const { restaurantId } = req.query;
  if (typeof restaurantId !== "string") {
    throw new ValidationError(
      "Failed to get menu categories. Please try again"
    );
  }

  const allCategories = await getAllCategoriesByRestaurantId(restaurantId);
  if (!isEmpty(allCategories)) {
    const isExists = await awsS3CheckIfFolderExists(`menus/${restaurantId}/`);
    if (!isExists) {
      throw new NotFoundError(
        "No found folders were found on Cloud Storage. Please try again or contact support for assistance"
      );
    }
  }

  const topSellingItems = await getTopSellingItems(5);

  if (allCategories && !isEmpty(allCategories) && !isEmpty(topSellingItems)) {
    let topSellingItemsCount = topSellingItems.length;

    outer: for (const category of allCategories) {
      for (const menuItem of category.menuItems) {
        for (let k = 0; k < topSellingItems.length; k++) {
          if (topSellingItems[k].menuItemId === menuItem.id) {
            menuItem.rank = k + 1;
            topSellingItemsCount--;
            if (topSellingItemsCount === 0) {
              break outer;
            }
            break;
          }
        }
      }
    }
  }

  return res.status(200).json(allCategories);
}

export default withApiHandler({
  methods: ["GET"],
  handler,
  isLoginRequired: false,
});
