import { Method } from "@/constants/fetch";
import {
  getOrderRequestByConditions,
  updateOrderRequestRejectedReasonDisplay,
} from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { ValidationError } from "@/lib/shared/error/ApiError";
import validateAndConvertQuery from "@/utils/validation/validateAndConvertQuery";
import { OrderRequestStatus } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

export type IGetOrderRequestRawQuery = ToRawQuery<IGetOrderRequestQuery>;

export interface IGetOrderRequestQuery {
  orderRequestId?: string;
  status?: OrderRequestStatus | OrderRequestStatus[];
  orderRequestNumber?: number;
  rejected?: boolean;
}

export interface IGetOrderRequestParam extends IGetOrderRequestQuery {
  orderId: string | null | undefined;
}

export interface IPatchOrderRequestBody {
  rejectedFlag: boolean;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === Method.GET) {
    const { orderId, ...params } = req.query;
    if (!orderId || typeof orderId !== "string") {
      throw new ValidationError(
        "Invalid orderId. Failed to get active order request info. Please try again"
      );
    }

    const validatedQuery = validateAndConvertQuery<IGetOrderRequestQuery>(
      params,
      {
        orderRequestId: { type: "string" },
        status: { type: { enum: OrderRequestStatus } },
        orderRequestNumber: { type: "number" },
        rejected: { type: "boolean" },
      }
    );

    const result = await getOrderRequestByConditions(orderId, validatedQuery);
    return res.status(200).json(result);
  }

  if (req.method === Method.PATCH) {
    const { orderId } = req.query;
    const { rejectedFlag }: IPatchOrderRequestBody = req.body;
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
}

export default withApiHandler({
  methods: ["GET", "PATCH"],
  handler,
  isLoginRequired: false,
});
