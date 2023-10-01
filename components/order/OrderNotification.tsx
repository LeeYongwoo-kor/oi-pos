import { ORDER_ENDPOINT } from "@/constants/endpoint";
import { Method } from "@/constants/fetch";
import { IOrder } from "@/database";
import { useToast } from "@/hooks/useToast";
import useMutation from "@/lib/client/useMutation";
import { IPatchOrderBody } from "@/pages/api/v1/orders/[orderId]";
import isEmpty from "@/utils/validation/isEmpty";
import { Order, OrderStatus, TableStatus } from "@prisma/client";
import { useEffect } from "react";
import LoadingOverlay from "../LoadingOverlay";

type OrderStatusNotificationProps = {
  orderInfo: IOrder;
};

const getTitle = (status: OrderStatus, isReserved: boolean) => {
  switch (status) {
    case OrderStatus.COMPLETED:
      return "Your Order is Complete!";
    case OrderStatus.CANCELLED:
      return "Your Order has been Cancelled";
    case OrderStatus.PENDING: {
      if (isReserved) {
        return "Checking reservation";
      }
      return "Your order is currently Pending";
    }
    default:
      return "Order Notification";
  }
};

const getSubtitle = (
  status: OrderStatus,
  isReserved: boolean,
  customerName: string | null
) => {
  switch (status) {
    case OrderStatus.COMPLETED:
      return "Thank you for your purchase!😚 Your order is now complete!😊";
    case OrderStatus.CANCELLED:
      return "We're sorry to hear that you've cancelled your order😥";
    case OrderStatus.PENDING: {
      if (isReserved) {
        return `Welcome ${customerName}! Is this the correct reservation for our restaurant?🤗`;
      }
      return "The order is pending by the restaurant. Please contact the staff around you🙏";
    }
    default:
      return "Order Notification Information";
  }
};

export default function OrderStatusNotification({
  orderInfo,
}: OrderStatusNotificationProps) {
  const [
    updateOrderStatus,
    { error: updateOrderStatusErr, loading: updateOrderStatusLoading },
  ] = useMutation<Order, IPatchOrderBody>(
    orderInfo && orderInfo.status === OrderStatus.PENDING
      ? ORDER_ENDPOINT.ORDER_BY_ID(orderInfo.id)
      : null,
    Method.PATCH
  );
  const { addToast } = useToast();

  const {
    status,
    customerName,
    table: { status: tableStatus },
  } = orderInfo;

  const isReserved =
    status === OrderStatus.PENDING && tableStatus === TableStatus.RESERVED;

  const handleChangeOrderStatus = async () => {
    if (!orderInfo || isEmpty(orderInfo) || updateOrderStatusLoading) {
      return;
    }

    await updateOrderStatus({
      status: OrderStatus.ORDERED,
      tableStatus: TableStatus.OCCUPIED,
    });
  };

  useEffect(() => {
    if (updateOrderStatusErr) {
      addToast("error", updateOrderStatusErr.message);
    }
  }, [updateOrderStatusErr]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      {updateOrderStatusLoading && <LoadingOverlay />}
      <div className="w-1/2 p-8 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center">
          <div className="mb-4 text-2xl font-bold text-gray-800">
            {getTitle(status, isReserved)}
          </div>
          <div className="mt-4 mb-8 text-lg font-semibold text-gray-600">
            {getSubtitle(status, isReserved, customerName)}
          </div>
          {isReserved && (
            <div className="flex items-center justify-center w-full">
              <button
                onClick={handleChangeOrderStatus}
                className="w-full px-3 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
              >
                Yes! I made a reservation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
