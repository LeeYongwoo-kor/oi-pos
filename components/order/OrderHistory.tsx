import { ORDER_ENDPOINT } from "@/constants/endpoint";
import { Method } from "@/constants/fetch";
import { IOrderItemForHistory } from "@/database";
import { useToast } from "@/hooks/useToast";
import useMutation from "@/lib/client/useMutation";
import { IPatchOrderBody } from "@/pages/api/v1/orders/[orderId]";
import {
  orderInfoState,
  showOrderHistoryState,
} from "@/recoil/state/orderState";
import getCurrency from "@/utils/menu/getCurrencyFormat";
import { calculateTotalPrice } from "@/utils/order/setDefaultMenuOptions";
import isEmpty from "@/utils/validation/isEmpty";
import { Order, OrderRequestStatus, OrderStatus } from "@prisma/client";
import { SetStateAction, useEffect, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import Loader from "../Loader";
import BottomSheet from "../ui/BottomSheet";
import OrderItemDetail from "./OrderItemDetail";

export default function OrderHistory() {
  const orderInfo = useRecoilValue(orderInfoState);
  const [isVisible, openOrderHistory] = useRecoilState(showOrderHistoryState);
  const [sharedOrderItemData, setSharedOrderItemData] = useState<
    IOrderItemForHistory[] | null
  >(null);
  const [
    updateOrderStatus,
    { error: updateOrderStatusErr, loading: updateOrderStatusLoading },
  ] = useMutation<Order, IPatchOrderBody>(
    orderInfo ? ORDER_ENDPOINT.ORDER_BY_ID(orderInfo.orderId) : null,
    Method.PATCH
  );
  const { addToast } = useToast();

  const isDisabled =
    !orderInfo ||
    isEmpty(orderInfo) ||
    !sharedOrderItemData ||
    isEmpty(sharedOrderItemData) ||
    updateOrderStatusLoading;

  const handleOrderItemDataChange = (
    newData: SetStateAction<IOrderItemForHistory[] | null>
  ) => {
    setSharedOrderItemData(newData);
  };

  const handleOrderPaymentRequest = async () => {
    if (!orderInfo || isEmpty(orderInfo) || updateOrderStatusLoading) {
      return;
    }

    const status = orderInfo.orderStatus;
    const result = await updateOrderStatus({
      status:
        status === OrderStatus.PAYMENT_REQUESTED
          ? OrderStatus.ORDERED
          : OrderStatus.PAYMENT_REQUESTED,
    });

    if (result) {
      addToast(
        "success",
        `${
          status === OrderStatus.PAYMENT_REQUESTED ? "Cancellation of" : ""
        } Payment Requested Successfully!`
      );
      openOrderHistory(false);
    }
  };

  useEffect(() => {
    if (updateOrderStatusErr) {
      addToast("error", updateOrderStatusErr.message);
    }
  }, [updateOrderStatusErr]);

  return (
    <BottomSheet handleState={[isVisible, openOrderHistory]}>
      <OrderItemDetail
        tableId={orderInfo?.tableId}
        orderId={orderInfo?.orderId}
        queries={{
          requestStatus: [
            OrderRequestStatus.ACCEPTED,
            OrderRequestStatus.PLACED,
          ],
        }}
        onOrderItemDataChange={handleOrderItemDataChange}
      />
      <div className="flex self-end justify-center w-full mt-4">
        <div className="text-lg font-bold text-white">
          <span>Total Price: </span>
          <span className="text-yellow-300">
            {getCurrency(calculateTotalPrice(sharedOrderItemData), "JPY")}
          </span>
        </div>
        <button
          disabled={isDisabled}
          onClick={handleOrderPaymentRequest}
          className={`w-full px-4 py-2 text-lg font-semibold text-white rounded-full  ${
            isDisabled
              ? "opacity-75 cursor-not-allowed"
              : orderInfo?.orderStatus === OrderStatus.PAYMENT_REQUESTED
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {updateOrderStatusLoading ? (
            <Loader color="white" />
          ) : (
            `${
              orderInfo?.orderStatus === OrderStatus.PAYMENT_REQUESTED
                ? "Cancellation of"
                : ""
            } Payment Request`
          )}
        </button>
      </div>
    </BottomSheet>
  );
}
