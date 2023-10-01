import { updateOrderRequestRejectedReasonDisplay } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { NextApiRequest, NextApiResponse } from "next";

export interface IPatchOrderRequestRejectedFlagBody {
  rejectedFlag: boolean;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orderId } = req.query;
  const { rejectedFlag }: IPatchOrderRequestRejectedFlagBody = req.body;
  if (typeof orderId !== "string") {
    throw new ValidationError(
      "Failed to update order request status. Please try again"
    );
  }

  const result = await updateOrderRequestRejectedReasonDisplay(
    orderId,
    rejectedFlag
  );

  return res.status(200).json(result);
}

export default withApiHandler({
  methods: ["PATCH"],
  handler,
  isLoginRequired: false,
});
