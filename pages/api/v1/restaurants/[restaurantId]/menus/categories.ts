import { getAllCategoriesByRestaurantId, getTopSellingItems } from "@/database";
import awsS3CheckIfFolderExists from "@/lib/server/aws/awsS3CheckIfFolderExists";
import withApiHandler from "@/lib/server/withApiHandler";
import { NotFoundError, ValidationError } from "@/lib/shared/error/ApiError";
import isEmpty from "@/utils/validation/isEmpty";
import { NextApiRequest, NextApiResponse } from "next";

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

  const topSellingItems = await getTopSellingItems(restaurantId, 5);

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
