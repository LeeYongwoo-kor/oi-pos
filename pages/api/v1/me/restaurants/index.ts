import { ME_ENDPOINT } from "@/constants/endpoint";
import { RESTAURANT_URL } from "@/constants/url";
import { getRestaurantAllInfo } from "@/database";
import getFromCache from "@/lib/server/cache/getFromCache";
import withApiHandler from "@/lib/server/withApiHandler";
import { NotFoundError } from "@/lib/shared/error/ApiError";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session?: Session | null
) {
  const restaurant = await getFromCache(
    ME_ENDPOINT.RESTAURANT,
    session?.id,
    () => getRestaurantAllInfo(session?.id)
  );
  if (!restaurant) {
    throw NotFoundError.builder()
      .setMessage("Restaurant not found. Please create restaurant first")
      .setRedirectUrl(RESTAURANT_URL.SETUP.INFO)
      .setEndpoint(ME_ENDPOINT.RESTAURANT)
      .build();
  }

  return res.status(200).json(restaurant);
}

export default withApiHandler({
  methods: ["GET"],
  handler,
});
