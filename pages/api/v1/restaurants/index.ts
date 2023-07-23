import { Method } from "@/constants/fetch";
import { getRestaurantAllInfo } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { NotFoundError } from "@/lib/shared/ApiError";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";

export interface IPostSubscriptionBody {
  planId: PlanType;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session?: Session | null
) {
  if (req.method === Method.GET) {
    const restaurant = await getRestaurantAllInfo(session?.id);
    if (!restaurant) {
      throw new NotFoundError(
        "Restaurant not found. Please create restaurant first"
      );
    }

    return res.status(200).json(restaurant);
  }
}

export default withApiHandler({
  methods: ["GET"],
  handler,
});
