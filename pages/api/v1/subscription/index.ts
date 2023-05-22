import withApiHandler from "@/lib/server/withApiHandler";
import { Session } from "@/types/next-auth.types";
import { getSubscription, upsertSubscription } from "@/database";
import { NextApiRequest, NextApiResponse } from "next";
import { NotFoundError, UnauthorizedError } from "@/lib/shared/CustomError";
import { Method } from "@/constants/fetch";

export interface IPostSubscriptionBody {
  planId: PlanType;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session?: Session | null
) {
  if (req.method === Method.GET) {
    if (!session) {
      throw new UnauthorizedError("Unauthorized. You must be signed in");
    }

    const subscription = await getSubscription(session.id);
    if (!subscription) {
      throw new NotFoundError("Subscription not found. Please subscribe first");
    }

    return res.status(200).json(subscription);
  }
  if (req.method === Method.POST) {
    if (!session) {
      throw new UnauthorizedError("Unauthorized. You must be signed in");
    }

    const { planId }: IPostSubscriptionBody = req.body;
    const createSubscription = await upsertSubscription(session?.id, planId);

    return res.status(201).json(createSubscription);
  }
}

export default withApiHandler({
  methods: ["GET", "POST"],
  handler,
});
