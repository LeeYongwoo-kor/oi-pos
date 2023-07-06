import { Method } from "@/constants/fetch";
import {
  UpsertRestaurantInfoParams,
  updateRestaurantInfo,
  upsertRestaurantInfo,
} from "@/database";
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

    return res.status(200).json(upsertSubscription);
  }

  if (req.method === Method.PATCH) {
    const body: IPatchRestaurantInfoBody = req.body;
    const upsertSubscription =
      await updateRestaurantInfo<IPatchRestaurantInfoBody>(session?.id, body);

    return res.status(200).json(upsertSubscription);
  }
}

export default withApiHandler({
  methods: ["PUT", "PATCH"],
  handler,
});
