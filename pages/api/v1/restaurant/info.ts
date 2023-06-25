import { Method } from "@/constants/fetch";
import { UpsertRestaurantInfoParams, upsertRestaurantInfo } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { UnauthorizedError } from "@/lib/shared/ApiError";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";

export type IPutSubscriptionInfoBody = Omit<
  UpsertRestaurantInfoParams,
  "userId"
>;

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session?: Session | null
) {
  if (!session) {
    throw new UnauthorizedError("Unauthorized. You must be signed in");
  }

  const body: IPutSubscriptionInfoBody = req.body;
  const upsertSubscription = await upsertRestaurantInfo({
    userId: session?.id,
    ...body,
  });

  return res.status(200).json(upsertSubscription);
}

export default withApiHandler({
  methods: ["PUT"],
  handler,
});
