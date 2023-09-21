import { CART_ITEM_MAX_STORAGE } from "@/constants/menu";
import { getMenuItemsByCartItems } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { NotFoundError, ValidationError } from "@/lib/shared/error/ApiError";
import { ICartItem } from "@/recoil/state/cartItemState";
import isEmpty from "@/utils/validation/isEmpty";
import { NextApiRequest, NextApiResponse } from "next";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { cartItems } = req.query;

  if (!cartItems || typeof cartItems !== "string") {
    throw new ValidationError("Cart items are not valid");
  }

  let parsedCartItems: ICartItem[] = [];
  try {
    parsedCartItems = JSON.parse(decodeURIComponent(cartItems));
  } catch (err) {
    // Send error to Sentry
    console.error(err);
    throw new ValidationError("Invalid cart item format");
  }

  if (
    isEmpty(parsedCartItems) ||
    parsedCartItems.length > CART_ITEM_MAX_STORAGE
  ) {
    throw new ValidationError(
      "Failed to get menu Item info. Please try again or contact support for assistance"
    );
  }

  const menuItems = await getMenuItemsByCartItems(parsedCartItems);
  if (!menuItems) {
    throw new NotFoundError(
      "Failed to get menu Item info. Please try again or contact support for assistance"
    );
  }

  return res.status(200).json(menuItems);
}

export default withApiHandler({
  methods: ["GET"],
  handler,
  isLoginRequired: false,
});
