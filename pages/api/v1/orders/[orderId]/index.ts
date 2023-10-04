import { Method } from "@/constants/fetch";
import { getOrderById, updateOrderById } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { OrderStatus, Prisma, TableStatus } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

export interface IPatchOrderBody {
  status: OrderStatus | undefined;
  tableStatus?: TableStatus | undefined;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === Method.GET) {
    const { orderId } = req.query;

    if (typeof orderId !== "string") {
      throw new ValidationError("Failed to get order info. Please try again");
    }

    const result = await getOrderById(orderId);
    return res.status(200).json(result);
  }

  if (req.method === Method.PATCH) {
    const { orderId } = req.query;
    const { status, tableStatus }: IPatchOrderBody = req.body;

    if (typeof orderId !== "string") {
      throw new ValidationError(
        "Failed to update order info. Please try again"
      );
    }

    let conditions: Prisma.OrderUpdateInput = { status };

    if (tableStatus) {
      conditions = {
        ...conditions,
        table: { update: { status: tableStatus } },
      };
    }

    const result = await updateOrderById(orderId, conditions);
    return res.status(200).json(result);
  }
}

export default withApiHandler({
  methods: ["GET", "PATCH"],
  handler,
  isLoginRequired: false,
});
