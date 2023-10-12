import {
  ME_ENDPOINT,
  ORDER_ENDPOINT,
  OWNER_ENDPOINT,
} from "@/constants/endpoint";
import { DASHBOARD_URL } from "@/constants/url";
import { IOrder, IOrderItemForHistory } from "@/database";
import useLoading from "@/hooks/context/useLoading";
import { useToast } from "@/hooks/useToast";
import useMutation from "@/lib/client/useMutation";
import { IPostOrderPaymentBody } from "@/pages/api/v1/owner/restaurants/tables/[restaurantTableId]/orders/[orderId]/payments";
import buildEndpointWithQuery from "@/utils/converter/buildEndpointWithQuery";
import getCurrency from "@/utils/menu/getCurrencyFormat";
import { calculateTotalPrice } from "@/utils/order/setDefaultMenuOptions";
import isEmpty from "@/utils/validation/isEmpty";
import {
  faCreditCard,
  faMoneyBill1Wave,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  OrderPayment as OrderPaymentType,
  OrderRequestStatus,
  PaymentType,
} from "@prisma/client";
import { useRouter } from "next/router";
import { SetStateAction, useEffect, useState } from "react";
import useSWR from "swr";
import OrderItemDetail from "./OrderItemDetail";
import { useConfirm } from "@/hooks/useConfirm";
import { CONFIRM_DIALOG_MESSAGE } from "@/constants/message/confirm";

type OrderPaymentProps = {
  tableType: string | undefined;
  tableNumber: string | undefined;
  orderNumber: string | undefined;
};

export default function OrderPayment({
  tableType,
  tableNumber,
  orderNumber,
}: OrderPaymentProps) {
  const {
    data: orderInfoData,
    error: orderInfoErr,
    isValidating: orderInfoLoading,
  } = useSWR<IOrder>(
    tableType && tableNumber && orderNumber
      ? buildEndpointWithQuery(ME_ENDPOINT.ORDER, {
          tableType,
          tableNumber,
          orderNumber,
        })
      : null
  );
  const [
    createOrderPayment,
    { error: createOrderPaymentErr, loading: createOrderPaymentLoading },
  ] = useMutation<OrderPaymentType, IPostOrderPaymentBody>(
    orderInfoData
      ? OWNER_ENDPOINT.RESTAURANT.TABLE.ORDER.PAYMENT(
          orderInfoData.tableId,
          orderInfoData.id
        )
      : null
  );
  const [sharedOrderItemData, setSharedOrderItemData] = useState<
    IOrderItemForHistory[] | null
  >(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentType>(
    PaymentType.CASH
  );
  const handlePaymentTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPaymentType(e.target.value as PaymentType);
  };
  const { addToast } = useToast();
  const { showConfirm } = useConfirm();
  const router = useRouter();
  const withLoading = useLoading();

  const isDisabled =
    !orderInfoData ||
    isEmpty(orderInfoData) ||
    orderInfoLoading ||
    !sharedOrderItemData ||
    isEmpty(sharedOrderItemData) ||
    createOrderPaymentLoading;

  const handleCloseOrderPayment = async () => {
    router.push(
      {
        pathname: DASHBOARD_URL.BASE,
      },
      undefined,
      { shallow: true }
    );
  };

  const handleClickOrderPayment = async (
    orderPaymentBody: IPostOrderPaymentBody
  ) => {
    if (!orderInfoData || isEmpty(orderInfoData) || createOrderPaymentLoading) {
      return;
    }

    showConfirm({
      title: CONFIRM_DIALOG_MESSAGE.PAYMENT_ORDER.TITLE,
      message: CONFIRM_DIALOG_MESSAGE.PAYMENT_ORDER.MESSAGE,
      confirmText: CONFIRM_DIALOG_MESSAGE.PAYMENT_ORDER.CONFIRM_TEXT,
      cancelText: CONFIRM_DIALOG_MESSAGE.PAYMENT_ORDER.CANCEL_TEXT,
      buttonType: "confirm",
      onConfirm: async () => {
        await withLoading(() => handleConfirmOrderPayment(orderPaymentBody));
      },
    });
  };

  const handleConfirmOrderPayment = async (
    orderPaymentBody: IPostOrderPaymentBody
  ) => {
    if (!orderInfoData || isEmpty(orderInfoData) || createOrderPaymentLoading) {
      return;
    }

    const result = await createOrderPayment(orderPaymentBody, {
      additionalKeys: [
        ME_ENDPOINT.TABLE,
        ORDER_ENDPOINT.BASE(orderInfoData.id),
      ],
    });

    if (result) {
      await handleCloseOrderPayment();
      addToast(
        "success",
        `${tableType} ${tableNumber}: Payment for order ${orderNumber} is successful!`
      );
    }
  };

  const handleOrderItemDataChange = (
    newData: SetStateAction<IOrderItemForHistory[] | null>
  ) => {
    setSharedOrderItemData(newData);
  };

  useEffect(() => {
    if (orderInfoErr) {
      addToast("error", orderInfoErr.message);
    }
  }, [orderInfoErr]);

  useEffect(() => {
    if (createOrderPaymentErr) {
      addToast("error", createOrderPaymentErr.message);
    }
  }, [createOrderPaymentErr]);

  return (
    <div className="flex select-none font-archivo flex-col w-full max-h-[100vh] h-full p-4 bg-slate-700">
      <div className="relative flex items-center justify-center w-full pb-3 mb-4 border-b border-dashed border-slate-500">
        <div className="absolute left-0">
          <button
            onClick={handleCloseOrderPayment}
            className="p-2 font-semibold rounded-xl w-28 bg-slate-400 hover:bg-slate-500"
          >
            Close
          </button>
        </div>
        <div className="space-x-3 text-xl font-semibold text-red-400">
          <span>
            {tableType} {tableNumber}
          </span>
          <span className="text-sm text-slate-300">
            Order No: {orderNumber}
          </span>
        </div>
      </div>
      <OrderItemDetail
        tableId={orderInfoData?.table?.id}
        orderId={orderInfoData?.id}
        queries={{
          requestStatus: OrderRequestStatus.ACCEPTED,
        }}
        onOrderItemDataChange={handleOrderItemDataChange}
      />
      <div className="flex flex-col">
        <label className="mb-1 font-semibold text-blue-300">Pay with</label>
        <div className="flex p-2 space-x-2 bg-slate-200 rounded-xl">
          <label
            className={`flex font-semibold justify-center hover:bg-green-500 cursor-pointer items-center w-fit px-4 py-1.5 rounded-xl ${
              selectedPaymentType === PaymentType.CASH
                ? "bg-green-400"
                : "bg-gray-400"
            }`}
          >
            <input
              type="radio"
              name="paymentType"
              value={PaymentType.CASH}
              className="hidden"
              onChange={handlePaymentTypeChange}
            />
            <FontAwesomeIcon size="xl" icon={faMoneyBill1Wave} />
            <span className="ml-2">CASH</span>
          </label>
          <label
            className={`flex font-semibold justify-center hover:bg-green-500 cursor-pointer items-center w-fit px-4 py-1.5 rounded-xl ${
              selectedPaymentType === PaymentType.CREDIT_CARD
                ? "bg-green-400"
                : "bg-gray-400"
            }`}
          >
            <input
              type="radio"
              name="paymentType"
              value={PaymentType.CREDIT_CARD}
              className="hidden"
              onChange={handlePaymentTypeChange}
            />
            <FontAwesomeIcon size="xl" icon={faCreditCard} />
            <span className="ml-2">CREDIT CARD</span>
          </label>
        </div>
      </div>
      <div className="flex self-end justify-center w-full mt-4">
        <div className="text-lg font-bold text-white">
          <span>Total Price: </span>
          <span className="text-yellow-300">
            {getCurrency(calculateTotalPrice(sharedOrderItemData), "JPY")}
          </span>
        </div>
        <button
          disabled={isDisabled}
          onClick={() =>
            handleClickOrderPayment({
              totalAmount: calculateTotalPrice(sharedOrderItemData),
              paymentType: selectedPaymentType,
              currencyType: "JPY",
            })
          }
          className={`w-full px-4 py-2 text-lg font-semibold bg-blue-500 text-white rounded-full  ${
            isDisabled ? "opacity-75 cursor-not-allowed" : "hover:bg-blue-600"
          }`}
        >
          Payment
        </button>
      </div>
    </div>
  );
}
