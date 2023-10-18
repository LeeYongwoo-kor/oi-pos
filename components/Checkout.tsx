import { OWNER_ENDPOINT } from "@/constants/endpoint";
import { Method } from "@/constants/fetch";
import { TOAST_MESSAGE } from "@/constants/message/toast";
import { PaypalStatus } from "@/constants/status";
import { RESTAURANT_URL } from "@/constants/url";
import useVerifyOrder from "@/hooks/fetch/useVerifyOrder";
import { useToast } from "@/hooks/useToast";
import useMutation from "@/lib/client/useMutation";
import { ApiError } from "@/lib/shared/error/ApiError";
import {
  IPostSendInvoiceBody,
  IPostSendInvoiceResponse,
} from "@/pages/api/v1/owner/emails/send-invoice";
import {
  IDeletePaymentBody,
  IPostPaymentBody,
} from "@/pages/api/v1/owner/plans/payments/[orderId]";
import { IPostSubscriptionBody } from "@/pages/api/v1/owner/subscriptions";
import convertDatesToIntlString from "@/utils/converter/convertDatesToIntlString";
import {
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import { CurrencyType, Plan, PlanPayment, Subscription } from "@prisma/client";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Loader from "./Loader";

type CheckoutProps = {
  plan: Plan | Record<string, never>;
};

type ButtonWrapperProps = {
  planId: PlanType;
  planName: string;
  currency: Currency;
  showSpinner: boolean;
  amount: number;
};

// Custom component to wrap the PayPalButtons and handle currency changes
const ButtonWrapper = ({
  planId,
  planName,
  currency,
  showSpinner,
  amount,
}: ButtonWrapperProps) => {
  // usePayPalScriptReducer can be use only inside children of PayPalScriptProviders
  // This is the main reason to wrap the PayPalButtons in a new component
  const [{ options, isPending }, dispatch] = usePayPalScriptReducer();
  const { addToast } = useToast();
  const { verifyOrder } = useVerifyOrder();
  const [createPayment, { error: createPaymentErr }] = useMutation<
    PlanPayment,
    IPostPaymentBody,
    CheckoutDynamicUrl
  >(
    ({ orderId }) => OWNER_ENDPOINT.PLAN.PAYMENT.CHECK_OUT(orderId),
    Method.POST
  );
  const [createSubscription, { error: createSubscriptionErr }] = useMutation<
    Subscription,
    IPostSubscriptionBody
  >(OWNER_ENDPOINT.SUBSCRIPTION, Method.POST);
  const [sendInvoice, { error: sendInvoiceErr }] = useMutation<
    IPostSendInvoiceResponse,
    IPostSendInvoiceBody
  >(OWNER_ENDPOINT.EMAIL.SEND_INVOICE, Method.POST);
  const [deletePayment, { error: deletePaymentErr }] = useMutation<
    { count: number } | null,
    IDeletePaymentBody,
    CheckoutDynamicUrl
  >(
    ({ orderId }) => OWNER_ENDPOINT.PLAN.PAYMENT.CHECK_OUT(orderId),
    Method.DELETE
  );
  const router = useRouter();

  useEffect(() => {
    dispatch({
      type: "resetOptions",
      value: {
        ...options,
        currency: currency,
      },
    });
  }, [currency, showSpinner]);

  return (
    <>
      {showSpinner && isPending && <Loader />}
      <PayPalButtons
        style={{ layout: "vertical" }}
        disabled={false}
        forceReRender={[amount, currency]}
        fundingSource={undefined}
        createOrder={(data, actions) => {
          return actions.order
            .create({
              intent: "CAPTURE",
              purchase_units: [
                {
                  amount: {
                    currency_code: currency,
                    value: String(amount),
                  },
                  custom_id: planId,
                },
              ],
            })
            .then(async (orderId) => {
              await createPayment(
                {
                  planId,
                  orderId,
                  status: PaypalStatus.CREATED,
                  amount,
                  currency,
                },
                { dynamicUrl: orderId }
              );

              if (createPaymentErr) {
                throw createPaymentErr;
              }

              return orderId;
            });
        }}
        onApprove={async function (data, actions) {
          const orderId = data.orderID;
          const approveVerifyResult = await verifyOrder(orderId);
          if (approveVerifyResult.error) {
            throw approveVerifyResult.error;
          }

          return actions.order?.capture().then(async function (data) {
            const captureVerifyResult = await verifyOrder(orderId);
            if (captureVerifyResult.error) {
              throw captureVerifyResult.error;
            }

            const subscription = await createSubscription({ planId });
            if (!subscription || createSubscriptionErr) {
              throw createSubscriptionErr;
            }

            const createdAt = convertDatesToIntlString(subscription.createdAt, {
              year: true,
            });
            const expiresAt = convertDatesToIntlString(
              subscription.currentPeriodEnd,
              { year: true }
            );

            if (!createdAt || !expiresAt) {
              // Send error to Sentry
              console.error("Error occurred during date conversion in PayPal");
            }

            await sendInvoice({
              orderData: {
                orderId,
                planName,
                amount,
                createdAt: createdAt || "",
                expiresAt: expiresAt || "",
              },
            });

            if (sendInvoiceErr) {
              throw sendInvoiceErr;
            }

            await router.replace(RESTAURANT_URL.SETUP.INFO);
            addToast("success", TOAST_MESSAGE.REGISTERATION.SUCCESS);
          });
        }}
        onCancel={async function (data) {
          const orderId = data?.orderID as string;

          if (!orderId) {
            await deletePayment({ orderId }, { dynamicUrl: orderId });
          }

          if (deletePaymentErr) {
            throw deletePaymentErr;
          }
        }}
        onError={function (err: Record<string, unknown>) {
          const errMessage =
            err instanceof ApiError
              ? err.message
              : "Error occurred during payment";
          // TODO: send error to Sentry
          console.error(err);
          addToast("error", errMessage);
        }}
      />
    </>
  );
};

export default function Checkout({ plan }: CheckoutProps) {
  return (
    <div className="max-w-[750px] min-h-[250px] mx-auto">
      <PayPalScriptProvider
        options={{
          "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
          components: "buttons",
          currency: plan?.currency ? plan.currency : CurrencyType.USD,
          locale: "ja_JP",
        }}
      >
        <ButtonWrapper
          planId={plan.id as PlanType}
          planName={plan.name}
          amount={plan.price}
          currency={plan.currency}
          showSpinner={false}
        />
      </PayPalScriptProvider>
    </div>
  );
}
