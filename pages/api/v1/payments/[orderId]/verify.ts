import { PaypalStatus } from "@/constants/status";
import { apiClient } from "@/lib/server/paypal";
import withApiHandler from "@/lib/server/withApiHandler";
import CustomError from "@/utils/CustomError";
import { getPaymentByOrderId } from "@/utils/database";
import { hasNullUndefined } from "@/utils/hasNullUndefined";
import { NextApiRequest, NextApiResponse } from "next";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orderId } = req.body;

  try {
    const ordersGetRequest = new apiClient.orders.OrdersGetRequest(orderId);
    const ordersGetResponse = await apiClient
      .client()
      .execute(ordersGetRequest);

    if (ordersGetResponse.result.status === PaypalStatus.APPROVED) {
      const { orderId } = req.body;

      const payment = await getPaymentByOrderId(orderId as string);
      if (!payment) {
        res.status(400).json({ error: "Bad Request" });
      }

      const { custom_id, value, currency_code } =
        ordersGetResponse.result.purchase_units[0].amount;

      if (hasNullUndefined({ custom_id, value, currency_code })) {
        res.status(400).json({ error: "Bad Request" });
      }

      const expectedPlanId = payment?.planId;
      const expectedAmount = payment?.amount;
      const expectedCurrency = payment?.currency;

      if (
        value !== expectedAmount ||
        currency_code !== expectedCurrency ||
        custom_id !== expectedPlanId
      ) {
        res.status(400).json({ message: "Bad Request" });
      }

      res.status(200).json({ message: "Verified successfully" });
    }
  } catch (error) {
    console.error("Error verifying the order: ", error);
    const errorIns = error instanceof Error ? error : new Error(String(error));
    throw new CustomError("Error verifying the order", errorIns);
  }
}

export default withApiHandler({
  methods: ["POST"],
  handler,
});
