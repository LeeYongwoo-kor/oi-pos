import { Method } from "@/constants/fetch";
import { getAllPlans } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { NextApiRequest, NextApiResponse } from "next";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === Method.GET) {
    const plans = await getAllPlans();

    if (!plans) {
      return res
        .status(404)
        .json({ message: "Failed to get plans information" });
    }

    return res.status(200).json(plans);
  }
}

export default withApiHandler({
  methods: ["GET"],
  handler,
});
