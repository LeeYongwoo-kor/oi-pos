import { PaypalStatus } from "@/constants/status";
import { getPaymentByOrderId } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { apiClient } from "@/lib/services/paypal";
import {
  BadGatewayError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/shared/ApiError";
import checkNullUndefined from "@/utils/checkNullUndefined";
import { NextApiRequest, NextApiResponse } from "next";

export interface IVerifyPaymentBody {
  orderId: string;
}
export interface IVerifyOrderResponse {
  message: string;
  orderStatus: PaypalStatusType;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orderId }: IVerifyPaymentBody = req.body;

  const ordersGetRequest = new apiClient.orders.OrdersGetRequest(orderId);
  const ordersGetResponse = await apiClient.client().execute(ordersGetRequest);

  if (ordersGetResponse.statusCode !== 200) {
    throw new BadGatewayError(
      "Failed to verify payment with PayPal API. Please try again later"
    );
  }

  const payment = await getPaymentByOrderId(orderId);
  if (!payment) {
    throw new NotFoundError(
      "Payment information not found for the provided orderId. Please try again later"
    );
  }

  const orderGetResponseStatus = ordersGetResponse.result.status;
  const { value, currency_code } =
    ordersGetResponse.result.purchase_units[0].amount;
  const { custom_id } = ordersGetResponse.result.purchase_units[0];

  const { hasNullUndefined, nullOrUndefinedKeys } = checkNullUndefined({
    custom_id,
    value,
    currency_code,
  });

  if (hasNullUndefined) {
    //TODO: send error to sentry
    console.error(`Null or undefined keys: ${nullOrUndefinedKeys}`);
    throw new ValidationError(
      "Failed to verify payment with PayPal API. Please try again later"
    );
  }

  const expectedPlanId = payment?.planId;
  const expectedAmount = payment?.amount;
  const expectedCurrency = payment?.currency;
  const paymentStatus = payment?.status;

  if (
    parseFloat(value) !== expectedAmount ||
    currency_code !== expectedCurrency ||
    custom_id !== expectedPlanId ||
    paymentStatus === PaypalStatus.COMPLETED ||
    orderGetResponseStatus === PaypalStatus.VOIDED
  ) {
    throw new ConflictError(
      "Payment information does not match. Please try again later"
    );
  }

  return res.status(200).json({
    message: "Verified successfully",
    orderStatus: orderGetResponseStatus,
  });
}

export default withApiHandler({
  methods: ["POST"],
  handler,
});
