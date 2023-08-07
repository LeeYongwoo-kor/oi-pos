import { getRestaurantAllInfo } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { NotFoundError } from "@/lib/shared/error/ApiError";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session?: Session | null
) {
  const restaurant = await getRestaurantAllInfo(session?.id);
  if (!restaurant) {
    throw new NotFoundError(
      "Restaurant not found. Please create restaurant first"
    );
  }

  return res.status(200).json(restaurant);
}

export default withApiHandler({
  methods: ["GET"],
  handler,
});
