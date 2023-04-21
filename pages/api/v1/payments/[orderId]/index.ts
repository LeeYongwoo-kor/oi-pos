import withApiHandler from "@/lib/server/withApiHandler";
import CustomError from "@/utils/CustomError";
import {
  createPayment,
  getPaymentByOrderId,
  updatePaymentStatus,
} from "@/utils/database";
import { NextApiRequest, NextApiResponse } from "next";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { orderId } = req.query;

      const payment = await getPaymentByOrderId(orderId as string);
      if (!payment) {
        res.status(404).json({ error: "Not Found" });
      }

      res.status(200).json(payment);
    }

    if (req.method === "POST") {
      const { planId, orderId, status, amount, currency } = req.body;

      const newPayment = await createPayment(
        planId,
        orderId,
        status,
        amount,
        currency
      );
      if (!newPayment) {
        res.status(400).json({ error: "Bad Request" });
      }

      res.status(201).json(newPayment);
    }

    if (req.method === "PATCH") {
      const { orderId, newStatus } = req.body;

      const updatePayment = await updatePaymentStatus(orderId, newStatus);
      if (!updatePayment) {
        res.status(404).json({ error: "Not Found" });
      }

      res.status(204).end();
    }
  } catch (error) {
    console.error("Unexpected error occurred: ", error);
    const errorIns = error instanceof Error ? error : new Error(String(error));
    throw new CustomError("Error verifying the order", errorIns);
  }
}

export default withApiHandler({
  methods: ["GET", "POST", "PATCH"],
  handler,
});
