import { getRestaurantAllInfoById } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { NotFoundError, ValidationError } from "@/lib/shared/error/ApiError";
import { NextApiRequest, NextApiResponse } from "next";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { restaurantId } = req.query;
  if (typeof restaurantId !== "string") {
    throw new ValidationError("Invalid restaurantId type in query");
  }

  const restaurant = await getRestaurantAllInfoById(restaurantId);
  if (!restaurant) {
    throw new NotFoundError(
      "Failed to get restaurant info. Please try again or contact support for assistance"
    );
  }

  return res.status(200).json(restaurant);
}

export default withApiHandler({
  methods: ["GET"],
  handler,
  isLoginRequired: false,
});
