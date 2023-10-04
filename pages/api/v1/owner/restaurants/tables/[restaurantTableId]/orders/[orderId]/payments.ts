import { Method } from "@/constants/fetch";
import { createOrderPaymentAndUpateOrderStatus } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { NotFoundError } from "@/lib/shared/error/ApiError";
import { CurrencyType, PaymentType } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

export interface IPostOrderPaymentBody {
  totalAmount: number;
  paymentType?: PaymentType;
  currencyType?: CurrencyType;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === Method.POST) {
    const { restaurantTableId, orderId } = req.query;
    const { totalAmount, paymentType, currencyType }: IPostOrderPaymentBody =
      req.body;
    if (typeof restaurantTableId !== "string" || typeof orderId !== "string") {
      throw new NotFoundError(
        "Failed to create order payment. Please try again"
      );
    }

    const payment = await createOrderPaymentAndUpateOrderStatus(
      orderId,
      totalAmount,
      paymentType,
      currencyType
    );

    return res.status(200).json(payment);
  }
}

export default withApiHandler({
  methods: ["POST"],
  handler,
});
