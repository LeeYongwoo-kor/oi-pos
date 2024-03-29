import { Method } from "@/constants/fetch";
import {
  createPlanPayment,
  deletePlanPayments,
  getPlanPaymentByOrderId,
  updatePlanPaymentStatus,
} from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { NotFoundError, ValidationError } from "@/lib/shared/error/ApiError";
import { NextApiRequest, NextApiResponse } from "next";

export interface IGetPaymentQuery {
  orderId: string;
}
export interface IPostPaymentBody {
  planId: string;
  orderId: string;
  status: string;
  amount: number;
  currency: Currency;
}
export interface IPatchPaymentBody {
  orderId: string;
  newStatus: PaypalStatusType;
}
export interface IDeletePaymentBody {
  orderId: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === Method.GET) {
    const { orderId } = req.query;
    if (!orderId || typeof orderId !== "string") {
      throw new ValidationError("Failed to get payment info. Please try again");
    }

    const payment = await getPlanPaymentByOrderId(orderId);
    if (!payment) {
      throw new NotFoundError("Payment not found with the given orderId");
    }

    return res.status(200).json(payment);
  }

  if (req.method === Method.POST) {
    const { planId, orderId, status, amount, currency }: IPostPaymentBody =
      req.body;

    const newPayment = await createPlanPayment(
      planId,
      orderId,
      status,
      amount,
      currency
    );

    return res.status(201).json(newPayment);
  }

  if (req.method === Method.PATCH) {
    const { orderId, newStatus }: IPatchPaymentBody = req.body;
    await updatePlanPaymentStatus(orderId, newStatus);

    return res.status(204).end();
  }

  if (req.method === Method.DELETE) {
    const { orderId }: IDeletePaymentBody = req.body;
    await deletePlanPayments(orderId);

    return res.status(204).end();
  }
}

export default withApiHandler({
  methods: ["GET", "POST", "PATCH", "DELETE"],
  handler,
});
