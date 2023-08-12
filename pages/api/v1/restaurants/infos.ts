import { ME_ENDPOINT } from "@/constants/endpoint";
import { Method } from "@/constants/fetch";
import {
  UpsertRestaurantInfoParams,
  updateRestaurantInfo,
  upsertRestaurantInfo,
} from "@/database";
import setInCache from "@/lib/server/cache/setInCache";
import { updateCache } from "@/lib/server/cache/updateCache";
import withApiHandler from "@/lib/server/withApiHandler";
import { Restaurant } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";

export type IPutRestaurantInfoBody = Omit<UpsertRestaurantInfoParams, "userId">;

export type IPatchRestaurantInfoBody = Pick<
  Restaurant,
  "startTime" | "endTime" | "holidays" | "lastOrder"
>;

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session?: Session | null
) {
  if (req.method === Method.PUT) {
    const body: IPutRestaurantInfoBody = req.body;
    const upsertSubscription = await upsertRestaurantInfo({
      userId: session?.id,
      ...body,
    });

    await setInCache(ME_ENDPOINT.RESTAURANT, upsertSubscription, session?.id);
    return res.status(200).json(upsertSubscription);
  }

  if (req.method === Method.PATCH) {
    const body: IPatchRestaurantInfoBody = req.body;
    const updateSubscription =
      await updateRestaurantInfo<IPatchRestaurantInfoBody>(session?.id, body);

    await updateCache(ME_ENDPOINT.RESTAURANT, updateSubscription, session?.id);
    return res.status(200).json(updateSubscription);
  }
}

export default withApiHandler({
  methods: ["PUT", "PATCH"],
  handler,
});
