import useMutation from "@/lib/client/useMutation";
import { IPatchPaymentBody } from "@/pages/api/v1/payments/[orderId]";
import {
  IVerifyOrderResponse,
  IVerifyPaymentBody,
} from "@/pages/api/v1/payments/verify";
import { PlanPayment } from "@prisma/client";

export default function useVerifyOrder() {
  const [verifyMutation, verifyState] = useMutation<
    IVerifyOrderResponse,
    IVerifyPaymentBody
  >("/api/v1/payments/verify", "POST");
  const [updatePaymentMutation, updatePaymentState] = useMutation<
    PlanPayment,
    IPatchPaymentBody
  >("/api/v1/payments", "PATCH");

  const verifyOrder = async (orderId: string) => {
    // verify order
    const verifyData = { orderId };
    const verify = await verifyMutation(verifyData);

    if (verifyState.error) {
      return {
        verify: false,
        error: verifyState.error,
      };
    }

    // update payment
    const updatePaymentData = { orderId, newStatus: verify.orderStatus };
    await updatePaymentMutation(updatePaymentData, {
      dynamicUrl: orderId,
    });

    if (updatePaymentState.error) {
      return {
        verify: false,
        error: updatePaymentState.error,
      };
    }

    return { verify: true, error: null };
  };

  return { verifyOrder };
}
