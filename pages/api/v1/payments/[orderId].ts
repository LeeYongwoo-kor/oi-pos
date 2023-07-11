import { Method } from "@/constants/fetch";
import {
  createPayment,
  deletePayments,
  getPaymentByOrderId,
  updatePaymentStatus,
} from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { NotFoundError } from "@/lib/shared/ApiError";
import { NextApiRequest, NextApiResponse } from "next";

export interface IGetPaymentQuery {
  orderId: string;
  [key: string]: string | string[] | undefined;
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
    const { orderId } = req.query as IGetPaymentQuery;

    const payment = await getPaymentByOrderId(orderId);
    if (!payment) {
      throw new NotFoundError("Payment not found with the given orderId");
    }

    return res.status(200).json(payment);
  }

  if (req.method === Method.POST) {
    const { planId, orderId, status, amount, currency }: IPostPaymentBody =
      req.body;

    const newPayment = await createPayment(
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
    await updatePaymentStatus(orderId, newStatus);

    return res.status(204).end();
  }

  if (req.method === Method.DELETE) {
    const { orderId }: IDeletePaymentBody = req.body;
    await deletePayments(orderId);

    return res.status(204).end();
  }
}

export default withApiHandler({
  methods: ["GET", "POST", "PATCH", "DELETE"],
  handler,
});
