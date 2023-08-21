import { getAllCategoriesByRestaurantId } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { NextApiRequest, NextApiResponse } from "next";
import { ValidationError } from "yup";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { restaurantId } = req.query;
  if (typeof restaurantId !== "string") {
    throw new ValidationError("Invalid restaurantId type in query");
  }

  const allCategories = await getAllCategoriesByRestaurantId(restaurantId);
  return res.status(200).json(allCategories);
}

export default withApiHandler({
  methods: ["GET"],
  handler,
});
