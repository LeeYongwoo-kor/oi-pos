import { RESTAURANT_ORDER_ENDPOINT } from "@/constants/endpoint";
import { IOrderItem, IOrderItemForHistory } from "@/database";
import { useToast } from "@/hooks/useToast";
import buildEndpointWithQuery from "@/utils/converter/buildEndpointWithQuery";
import convertDatesToIntlString from "@/utils/converter/convertDatesToIntlString";
import getCloudImageUrl from "@/utils/menu/getCloudImageUrl";
import getCurrency from "@/utils/menu/getCurrencyFormat";
import { calculateTotalItemPrice } from "@/utils/order/setDefaultMenuOptions";
import isEmpty from "@/utils/validation/isEmpty";
import Image from "next/image";
import { useEffect } from "react";
import useSWR from "swr";
import Loader from "../Loader";
import { IGetOrderItemQuery } from "@/pages/api/v1/restaurants/tables/[restaurantTableId]/orders/[orderId]/items";

type OrderItemDetailProps = {
  tableId: string | undefined;
  orderId: string | undefined;
  queries?: IGetOrderItemQuery;
  onOrderItemDataChange?: (newData: IOrderItemForHistory[]) => void;
};

const getAllQuantityOfOrderItems = (orderItem: IOrderItem[] | undefined) => {
  if (!orderItem || isEmpty(orderItem)) {
    return 0;
  }

  return orderItem.reduce((totalAcc, item) => totalAcc + item.quantity, 0);
};

export default function OrderItemDetail({
  tableId,
  orderId,
  queries,
  onOrderItemDataChange,
}: OrderItemDetailProps) {
  const {
    data: orderItemData,
    error: orderItemErr,
    isValidating: orderItemLoading,
  } = useSWR<IOrderItemForHistory[]>(
    tableId && orderId
      ? buildEndpointWithQuery<IGetOrderItemQuery>(
          RESTAURANT_ORDER_ENDPOINT.ORDER_ITEM(tableId, orderId),
          queries
        )
      : null
  );
  const { addToast } = useToast();

  useEffect(() => {
    if (orderItemData && onOrderItemDataChange) {
      onOrderItemDataChange(orderItemData);
    }
  }, [orderItemData]);

  useEffect(() => {
    if (orderItemErr) {
      addToast("error", orderItemErr.message);
    }
  }, [orderItemErr]);

  return (
    <div className="flex flex-col items-center justify-between flex-1 overflow-x-hidden overflow-y-auto select-none scrollbar-hide sm:scrollbar-show sm:px-2">
      {orderItemLoading ? (
        <Loader color="white" />
      ) : (
        <div className="flex flex-col">
          <div className="grid grid-cols-6 gap-2 mb-2 text-sm text-white place-items-center sm:text-base sm:grid-cols-8">
            <div className="col-span-1">Image</div>
            <div className="col-span-1">Name</div>
            <div className="col-span-1 sm:hidden">Price</div>
            <div className="hidden sm:col-span-1 sm:block">Unit Price</div>
            <div className="col-span-1">Quantity</div>
            <div className="col-span-2">Options</div>
            <div className="hidden sm:col-span-1 sm:block">Order Time</div>
            <div className="hidden sm:col-span-1 sm:block">
              Total Item Price
            </div>
          </div>
          <hr className="mb-2" />
          {orderItemData &&
            orderItemData.map((item, index) => {
              const totalItemPrice = calculateTotalItemPrice(item);
              return (
                <div
                  key={index}
                  className="grid grid-cols-6 gap-2 p-2 mb-2 text-sm text-center rounded-lg sm:grid-cols-8 sm:text-base bg-slate-200"
                >
                  <div className="flex justify-center col-span-1">
                    <div className="relative w-14 h-14">
                      <Image
                        src={getCloudImageUrl(
                          item.menuItem?.imageUrl,
                          item.menuItem?.imageVersion
                        )}
                        alt={item.name || "menuName"}
                        quality={50}
                        fill
                        className="object-cover w-full rounded-full"
                        draggable={false}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-center col-span-1">
                    {item.name}
                  </div>
                  <div className="flex items-center justify-center col-span-1">
                    {getCurrency(item.price, "JPY")}
                  </div>
                  <div className="flex items-center justify-center col-span-1">
                    {item.quantity}
                  </div>
                  <div className="flex flex-col items-center justify-center col-span-2 text-xs sm:text-sm">
                    {item.selectedOptions.map((option, optionIndex) => (
                      <div key={optionIndex}>
                        {option.name} ({getCurrency(option.price, "JPY")})
                      </div>
                    ))}
                  </div>
                  <div className="items-center justify-center hidden text-sm sm:flex sm:col-span-1">
                    {convertDatesToIntlString(item.createdAt, {
                      onlyTime: true,
                    })}
                  </div>
                  <div className="items-center justify-center hidden sm:flex sm:col-span-1">
                    {getCurrency(totalItemPrice, "JPY")}
                  </div>
                </div>
              );
            })}
          <div className="self-end text-lg font-semibold text-white">
            Total Quantity Ordered: {getAllQuantityOfOrderItems(orderItemData)}
          </div>
        </div>
      )}
    </div>
  );
}
