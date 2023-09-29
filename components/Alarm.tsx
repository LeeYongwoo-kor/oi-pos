import {
  RESTAURANT_ORDER_ENDPOINT,
  RESTAURANT_TABLE_ENDPOINT,
} from "@/constants/endpoint";
import { ALARM_ORDER_REQUEST_LIMIT, Method } from "@/constants/fetch";
import { PROMPT_DIALOG_MESSAGE } from "@/constants/message/prompt";
import { MULTIPLICATION_SYMBOL } from "@/constants/unicode";
import { IOrderRequestForAlarm } from "@/database";
import { usePrompt } from "@/hooks/usePrompt";
import { useToast } from "@/hooks/useToast";
import useMutation from "@/lib/client/useMutation";
import { IPatchOrderRequestBody } from "@/pages/api/v1/restaurants/tables/[restaurantTableId]/orders/[orderId]/requests/[requestId]";
import {
  showAlarmState,
  sortRequestedOrderState,
} from "@/recoil/state/alarmState";
import convertDatesToIntlString from "@/utils/converter/convertDatesToIntlString";
import convertNumberToOrderNumber from "@/utils/converter/convertNumberToOrderNumber";
import { OrderRequest, OrderRequestStatus } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { useSWRConfig } from "swr";
import useSWRInfinite from "swr/infinite";
import Loader from "./Loader";

type AlarmProps = {
  restaurantId: string | undefined;
  onToggle: () => void;
};

export default function Alarm({ restaurantId, onToggle }: AlarmProps) {
  const [isSortedRequest, changeOrderRequestSort] = useRecoilState(
    sortRequestedOrderState
  );
  const isVisible = useRecoilValue(showAlarmState);
  const { mutate } = useSWRConfig();
  const {
    data,
    error,
    size,
    setSize,
    isValidating,
    isLoading,
    mutate: boundMutate,
  } = useSWRInfinite<IOrderRequestForAlarm[]>(
    (index, previousPageData) => {
      if (!restaurantId || (previousPageData && !previousPageData.length)) {
        return null;
      }
      const offset = index * ALARM_ORDER_REQUEST_LIMIT;
      return isSortedRequest
        ? `${RESTAURANT_ORDER_ENDPOINT.ORDER_REQUEST_FOR_ALARM(
            restaurantId
          )}?limit=${ALARM_ORDER_REQUEST_LIMIT}&offset=${offset}&status=${
            OrderRequestStatus.PLACED
          }`
        : `${RESTAURANT_ORDER_ENDPOINT.ORDER_REQUEST_FOR_ALARM(
            restaurantId
          )}?limit=${ALARM_ORDER_REQUEST_LIMIT}&offset=${offset}`;
    },
    { refreshInterval: 5000 }
  );
  const [updateOrderRequest, { error: updateOrderRequestErr }] = useMutation<
    OrderRequest,
    IPatchOrderRequestBody,
    OrderRequestDynamicUrl
  >(({ restaurantTableId, orderId, requestId }) => {
    return RESTAURANT_ORDER_ENDPOINT.ORDER_REQUEST_BY_ID(
      restaurantTableId,
      orderId,
      requestId
    );
  }, Method.PATCH);
  const sentinelRef = useRef(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const { addToast } = useToast();
  const { showPrompt } = usePrompt();

  const allData: IOrderRequestForAlarm[] = data
    ? ([] as IOrderRequestForAlarm[]).concat(...data)
    : [];

  console.log("allData", allData);

  const handleStatusChange = async (
    orderRequest: IOrderRequestForAlarm,
    status: OrderRequestStatus,
    rejectedReason = ""
  ) => {
    const {
      id,
      orderId,
      order: {
        table: { id: tableId },
      },
    } = orderRequest;

    if (!id || !orderId || !tableId) {
      return;
    }

    const updatedCurrentData = data?.map((page) =>
      page.map((item) =>
        item.id === orderRequest.id ? { ...item, status } : item
      )
    );

    if (updatedCurrentData) {
      boundMutate(updatedCurrentData, false);
    }

    const params: IPatchOrderRequestBody = {
      updateOrderRequestInfo: {
        status,
        rejectedReason,
        rejectedReasonDisplay: true,
      },
    };

    await updateOrderRequest(params, {
      dynamicUrl: { restaurantTableId: tableId, orderId, requestId: id },
      isMutate: false,
      additionalKeys: [RESTAURANT_TABLE_ENDPOINT.BASE],
    });
  };

  const handleAcceptRequest = async (orderRequest: IOrderRequestForAlarm) => {
    await handleStatusChange(orderRequest, OrderRequestStatus.ACCEPTED);
  };

  const handleRejectRequest = async (orderRequest: IOrderRequestForAlarm) => {
    showPrompt({
      title: PROMPT_DIALOG_MESSAGE.REJECT_ORDER_REQUEST.TITLE,
      message: PROMPT_DIALOG_MESSAGE.REJECT_ORDER_REQUEST.MESSAGE,
      confirmText: PROMPT_DIALOG_MESSAGE.REJECT_ORDER_REQUEST.CONFIRM_TEXT,
      cancelText: PROMPT_DIALOG_MESSAGE.REJECT_ORDER_REQUEST.CANCEL_TEXT,
      placeholder: PROMPT_DIALOG_MESSAGE.REJECT_ORDER_REQUEST.PLACEHOLDER,
      buttonType: "info",
      onConfirm: (rejectMessage) => {
        handleStatusChange(
          orderRequest,
          OrderRequestStatus.CANCELLED,
          rejectMessage
        );
      },
    });
  };

  useEffect(() => {
    if (data) {
      mutate(RESTAURANT_TABLE_ENDPOINT.BASE);
    }
  }, [data]);

  useEffect(() => {
    if (!isLoading && !isValidating) {
      const observer = new IntersectionObserver(
        (entries) => {
          const first = entries[0];
          if (first.isIntersecting) {
            // Check if we have reached the end of data
            const lastFetchedPage = data?.[data.length - 1] || [];
            if (lastFetchedPage.length < ALARM_ORDER_REQUEST_LIMIT) {
              return;
            }

            setIsFetchingMore(true);
            setSize(size + 1);
          }
        },
        { threshold: 1.0 }
      );

      const currentSentinel = sentinelRef.current;

      if (currentSentinel) {
        observer.observe(currentSentinel);
      }

      return () => {
        if (currentSentinel) {
          observer.unobserve(currentSentinel);
        }
        setIsFetchingMore(false);
      };
    }
  }, [size, isLoading, isValidating]);

  useEffect(() => {
    if (error) {
      addToast("error", error.message);
    }
  }, [error]);

  useEffect(() => {
    if (updateOrderRequestErr) {
      boundMutate(data, false);
      addToast("error", updateOrderRequestErr.message);
    }
  }, [updateOrderRequestErr]);

  return (
    <div
      className={`fixed right-0 h-screen pt-16 overflow-x-hidden overflow-y-auto bg-white select-none max-h-fit w-80 font-archivo transition-all duration-200 ease-in-out ${
        isVisible ? "transform translate-x-0" : "transform translate-x-96"
      }`}
    >
      <div className="relative h-full p-2">
        <button
          onClick={onToggle}
          className="absolute top-0 p-2 bg-white border border-gray-300 hover:bg-gray-100 -right-1 rounded-l-md"
        >
          &raquo;
        </button>
        <div className="flex items-center space-x-2">
          <span>All</span>
          <div className="relative inline-block w-10 align-middle cursor-pointer select-none">
            <input
              type="checkbox"
              name="isEditing"
              id="isEditing"
              onChange={() => changeOrderRequestSort(!isSortedRequest)}
              className="hidden"
            />
            <label
              htmlFor="isEditing"
              className={`block h-5 overflow-hidden transform transition-colors rounded-full cursor-pointer toggle-label ${
                isSortedRequest ? "bg-green-300" : "bg-blue-300"
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full shadow transform transition-transform ${
                  isSortedRequest
                    ? "translate-x-full bg-green-500"
                    : "translate-x-0 bg-blue-500"
                } ease-in-out duration-200`}
              ></span>
            </label>
          </div>
          <span>Request</span>
        </div>
        <div className="w-full h-full p-2 bg-white">
          {(isLoading || !restaurantId) && <Loader />}
          {allData?.map((orderRequest, orderIndex) => (
            <div
              key={orderRequest.id + orderIndex}
              className={`p-2 mb-2 border rounded-lg shadow-sm ${
                orderRequest.status === OrderRequestStatus.PLACED
                  ? "bg-sky-50 fade-in border-sky-200"
                  : orderRequest.status === OrderRequestStatus.CANCELLED
                  ? "bg-red-100 border-red-200"
                  : ""
              }`}
            >
              <div className="flex justify-between">
                <div className="space-x-2 text-lg font-semibold">
                  <span>{orderRequest.order.table.tableType}</span>
                  <span>{orderRequest.order.table.number}</span>
                </div>
                <div className="flex flex-col justify-end text-xs text-slate-500">
                  <div className="self-end">
                    Order No.{" "}
                    {convertNumberToOrderNumber(orderRequest.order.orderNumber)}
                  </div>
                  <div className="self-end">
                    {convertDatesToIntlString(orderRequest.createdAt)}
                  </div>
                </div>
              </div>
              <div className="flex flex-col p-2 border border-gray-300 rounded">
                {orderRequest.orderItems.map((item, itemIndex) => (
                  <div className="flex flex-col" key={item.id + itemIndex}>
                    <div>
                      <span className="mr-2 font-semibold text-sky-700">
                        {itemIndex + 1}
                      </span>
                      <span className="font-medium text-slate-700">
                        {item.name} ({MULTIPLICATION_SYMBOL} {item.quantity})
                      </span>
                    </div>
                    <div className="-mt-0.5 -space-y-1 text-sm indent-3">
                      {item.selectedOptions.map((option, optionIndex) => (
                        <div key={option.id + optionIndex}>・{option.name}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex mt-2">
                <button
                  onClick={() => handleAcceptRequest(orderRequest)}
                  disabled={orderRequest.status === OrderRequestStatus.ACCEPTED}
                  className={`w-3/5 px-3 py-0.5 mr-2 rounded ${
                    orderRequest.status === OrderRequestStatus.ACCEPTED
                      ? "border border-green-500 text-green-500"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  {orderRequest.status === OrderRequestStatus.ACCEPTED && "✔ "}
                  Accept
                </button>
                <button
                  onClick={() => handleRejectRequest(orderRequest)}
                  disabled={
                    orderRequest.status === OrderRequestStatus.CANCELLED
                  }
                  className={`w-2/5 px-3 py-0.5 rounded ${
                    orderRequest.status === OrderRequestStatus.CANCELLED
                      ? "border border-red-400 text-red-400"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                >
                  {orderRequest.status === OrderRequestStatus.CANCELLED && "✔ "}
                  Reject
                </button>
              </div>
            </div>
          ))}
          {(isFetchingMore || isValidating) && (
            <div className="h-20">
              <Loader />
            </div>
          )}
          <div className="h-1" ref={sentinelRef}></div>
        </div>
      </div>
    </div>
  );
}
