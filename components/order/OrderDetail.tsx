import {
  ME_ENDPOINT,
  ORDER_ENDPOINT,
  RESTAURANT_ORDER_ENDPOINT,
} from "@/constants/endpoint";
import { Method } from "@/constants/fetch";
import { CONFIRM_DIALOG_MESSAGE } from "@/constants/message/confirm";
import { IOrderForOrderDetail } from "@/database";
import useLoading from "@/hooks/context/useLoading";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import useMutation, { ApiErrorState } from "@/lib/client/useMutation";
import { IPatchOrderBody } from "@/pages/api/v1/orders/[orderId]";
import { IGetOrderQuery } from "@/pages/api/v1/restaurants/tables/[restaurantTableId]/orders";
import buildEndpointWithQuery from "@/utils/converter/buildEndpointWithQuery";
import convertDatesToIntlString from "@/utils/converter/convertDatesToIntlString";
import convertNumberToOrderNumber from "@/utils/converter/convertNumberToOrderNumber";
import getCurrency from "@/utils/menu/getCurrencyFormat";
import isEmpty from "@/utils/validation/isEmpty";
import { Order, OrderStatus, TableStatus } from "@prisma/client";
import { useEffect } from "react";
import useSWR from "swr";
import Loader from "../Loader";

const statusToBgColor = {
  [OrderStatus.ORDERED]: "bg-green-300",
  [OrderStatus.PAYMENT_REQUESTED]: "bg-indigo-400",
  [OrderStatus.PENDING]: "bg-yellow-500",
  [OrderStatus.CANCELLED]: "bg-slate-200",
  [OrderStatus.COMPLETED]: "bg-slate-200",
};

const statusToBadgeColor = {
  [OrderStatus.ORDERED]: "bg-green-700",
  [OrderStatus.PAYMENT_REQUESTED]: "bg-indigo-700",
  [OrderStatus.PENDING]: "bg-yellow-700",
  [OrderStatus.CANCELLED]: "bg-red-600",
  [OrderStatus.COMPLETED]: "bg-blue-900",
};

type OrderDetailProps = {
  tableId: string | undefined;
  queries?: IGetOrderQuery;
  hasActiveOrder?: (activateOrder: IOrderForOrderDetail | null) => void;
};

export default function OrderDetail({
  tableId,
  queries,
  hasActiveOrder,
}: OrderDetailProps) {
  const {
    data: orderInfo,
    error: orderInfoErr,
    isValidating: orderInfoLoading,
    mutate: boundMutate,
  } = useSWR<IOrderForOrderDetail[]>(
    tableId
      ? buildEndpointWithQuery<IGetOrderQuery>(
          RESTAURANT_ORDER_ENDPOINT.BASE(tableId),
          queries
        )
      : null
  );
  const [
    updateOrderStatus,
    { error: updateOrderStatusErr, loading: updateOrderStatusLoading },
  ] = useMutation<Order, IPatchOrderBody, OrderDetailDynamicUrl>(
    ({ orderId }) => ORDER_ENDPOINT.BASE(orderId),
    Method.PATCH
  );
  const { addToast } = useToast();
  const { showConfirm } = useConfirm();
  const withLoading = useLoading();

  const handleConfirmOrderStatus = async (
    orderId: string,
    status: OrderStatus
  ) => {
    if (
      !orderId ||
      !status ||
      !tableId ||
      orderInfoLoading ||
      updateOrderStatusLoading
    ) {
      return;
    }

    const params: IPatchOrderBody = {
      status,
      tableStatus:
        status === OrderStatus.CANCELLED ? TableStatus.AVAILABLE : null,
    };

    await updateOrderStatus(params, {
      dynamicUrl: { orderId },
      isMutate: false,
      additionalKeys: [ME_ENDPOINT.ORDER_REQUEST, ME_ENDPOINT.TABLE],
    });

    boundMutate();
    if (hasActiveOrder) {
      hasActiveOrder(null);
    }
  };

  const handleEditOrderStatus = (orderId: string, status: OrderStatus) => {
    if (!orderId || !status || orderInfoLoading || updateOrderStatusLoading) {
      return;
    }

    showConfirm({
      title: CONFIRM_DIALOG_MESSAGE.CHANGE_ORDER_STATUS.TITLE,
      message: CONFIRM_DIALOG_MESSAGE.CHANGE_ORDER_STATUS.MESSAGE,
      confirmText: CONFIRM_DIALOG_MESSAGE.CHANGE_ORDER_STATUS.CONFIRM_TEXT,
      cancelText: CONFIRM_DIALOG_MESSAGE.CHANGE_ORDER_STATUS.CANCEL_TEXT,
      buttonType: "warn",
      onConfirm: async () => {
        await withLoading(() => handleConfirmOrderStatus(orderId, status));
      },
    });
  };

  const handleCancelOrderStatus = (orderId: string) => {
    if (!orderId || orderInfoLoading) {
      return;
    }

    showConfirm({
      title: CONFIRM_DIALOG_MESSAGE.CANCEL_ORDER_STATUS.TITLE,
      message: CONFIRM_DIALOG_MESSAGE.CANCEL_ORDER_STATUS.MESSAGE,
      confirmText: CONFIRM_DIALOG_MESSAGE.CANCEL_ORDER_STATUS.CONFIRM_TEXT,
      cancelText: CONFIRM_DIALOG_MESSAGE.CANCEL_ORDER_STATUS.CANCEL_TEXT,
      buttonType: "fatal",
      onConfirm: async () => {
        await withLoading(() =>
          handleConfirmOrderStatus(orderId, OrderStatus.CANCELLED)
        );
      },
    });
  };

  useEffect(() => {
    if (orderInfo && hasActiveOrder) {
      const activateOrder = orderInfo.find(
        (order) =>
          order.status !== OrderStatus.COMPLETED &&
          order.status !== OrderStatus.CANCELLED
      );

      if (activateOrder) {
        hasActiveOrder(activateOrder);
      }
    }
  }, [orderInfo]);

  const handleErrors = (error: ApiErrorState | null | undefined) => {
    if (error) {
      addToast("error", error.message);
    }
  };

  useEffect(() => {
    handleErrors(updateOrderStatusErr);
    handleErrors(orderInfoErr);
  }, [updateOrderStatusErr, orderInfoErr]);

  return (
    <div className="flex flex-col items-center justify-between flex-1 overflow-y-auto select-none sm:px-2">
      {orderInfoLoading ? (
        <Loader color="white" />
      ) : (
        <div className="flex flex-col w-full">
          <div className="grid grid-cols-8 gap-2 mb-2 text-center text-white">
            <div className="col-span-1">Order Number</div>
            <div className="col-span-1">Order Time</div>
            <div className="col-span-1">Finish Time</div>
            <div className="col-span-1">Order Amount</div>
            <div className="col-span-2">Current Status</div>
            <div className="col-span-2">Edit</div>
          </div>
          <hr className="mb-2" />
          {orderInfo &&
            orderInfo.map((order, index) => {
              return (
                <div
                  key={order.id + index}
                  className={`grid grid-cols-8 gap-2 p-2 mb-2 text-center rounded-lg ${
                    statusToBgColor[order.status]
                  }`}
                >
                  <div className="flex items-center justify-center col-span-1">
                    {convertNumberToOrderNumber(order.orderNumber)}
                  </div>
                  <div className="flex items-center justify-center col-span-1 text-sm">
                    {convertDatesToIntlString(order.createdAt, {
                      hideSecond: true,
                    })}
                  </div>
                  <div className="flex items-center justify-center col-span-1 text-sm">
                    {!isEmpty(order.orderPayment) &&
                      convertDatesToIntlString(order.orderPayment.createdAt, {
                        hideSecond: true,
                      })}
                  </div>
                  <div className="flex items-center justify-center col-span-1">
                    {!isEmpty(order.orderPayment) &&
                      getCurrency(order.orderPayment.totalAmount, "JPY")}
                  </div>
                  <div className="flex items-center justify-center col-span-2 text-sm">
                    {renderStatus(order.status)}
                  </div>
                  <div className="flex items-center justify-center col-span-2 pr-2 text-sm">
                    {renderButton({
                      status: order.status,
                      handleEditOrderStatus,
                      handleCancelOrderStatus,
                      orderId: order.id,
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

function renderStatus(status: OrderStatus) {
  return (
    <span
      className={`text-white px-2 py-0.5 rounded-3xl ${statusToBadgeColor[status]}`}
    >
      {status}
    </span>
  );
}

type RenderButtonProps = {
  status: OrderStatus;
  handleEditOrderStatus: (orderId: string, status: OrderStatus) => void;
  handleCancelOrderStatus: (orderId: string) => void;
  orderId: string;
};

function renderButton({
  status,
  handleEditOrderStatus,
  handleCancelOrderStatus,
  orderId,
}: RenderButtonProps) {
  if (status === OrderStatus.COMPLETED || status === OrderStatus.CANCELLED) {
    return (
      <span className="text-gray-500">
        This order has already been processed
      </span>
    );
  }

  return (
    <div className="flex w-full">
      {status === OrderStatus.PENDING ? (
        <ActionButton
          label="ACTIVATE"
          color="green"
          onClick={() => handleEditOrderStatus(orderId, OrderStatus.ORDERED)}
        />
      ) : (
        <ActionButton
          label="HOLD ON"
          color="yellow"
          onClick={() => handleEditOrderStatus(orderId, OrderStatus.PENDING)}
        />
      )}
      <ActionButton
        label="CANCEL"
        color="red"
        onClick={() => handleCancelOrderStatus(orderId)}
      />
    </div>
  );
}

type ActionButtonProps = {
  label: string;
  color: "green" | "yellow" | "red";
  onClick: () => void;
};

function ActionButton({ label, color, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 mx-1 flex-1 text-white rounded bg-${color}-600 hover:bg-${color}-700`}
    >
      {label}
    </button>
  );
}
