import { RESTAURANT_ORDER_ENDPOINT } from "@/constants/endpoint";
import { IOrderItem, IOrderItemForHistory } from "@/database";
import { useToast } from "@/hooks/useToast";
import convertDatesToIntlString from "@/utils/converter/convertDatesToIntlString";
import getCurrency from "@/utils/menu/getCurrencyFormat";
import { calculateTotalItemPrice } from "@/utils/order/setDefaultMenuOptions";
import isEmpty from "@/utils/validation/isEmpty";
import Image from "next/image";
import { useEffect } from "react";
import useSWR from "swr";
import Loader from "../Loader";

type OrderHistoryDetailProps = {
  tableId: string | undefined;
  orderId: string | undefined;
  onOrderItemDataChange?: (newData: IOrderItemForHistory[]) => void;
};

const getAllQuantityOfOrderItems = (orderItem: IOrderItem[] | undefined) => {
  if (!orderItem || isEmpty(orderItem)) {
    return 0;
  }

  return orderItem.reduce((totalAcc, item) => totalAcc + item.quantity, 0);
};

export default function OrderHistoryDetail({
  tableId,
  orderId,
  onOrderItemDataChange,
}: OrderHistoryDetailProps) {
  const {
    data: orderItemData,
    error: orderItemErr,
    isValidating: orderItemLoading,
  } = useSWR<IOrderItemForHistory[]>(
    tableId && orderId
      ? RESTAURANT_ORDER_ENDPOINT.ORDER_ITEM(tableId, orderId)
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
    <div className="flex flex-col items-center justify-between flex-1 overflow-y-auto sm:px-2">
      {orderItemLoading ? (
        <Loader color="white" />
      ) : (
        <div>
          <div className="grid grid-cols-8 gap-2 mb-2 text-center text-white">
            <div className="col-span-1">Image</div>
            <div className="col-span-1">Name</div>
            <div className="col-span-1">Unit Price</div>
            <div className="col-span-1">Quantity</div>
            <div className="col-span-2">Options</div>
            <div className="col-span-1">Order Time</div>
            <div className="col-span-1">Total Item Price</div>
          </div>
          <hr className="mb-2" />
          {orderItemData &&
            orderItemData.map((item, index) => {
              const totalItemPrice = calculateTotalItemPrice(item);
              return (
                <div
                  key={index}
                  className="grid grid-cols-8 gap-2 p-2 mb-2 text-center rounded-lg bg-slate-200"
                >
                  <div className="flex justify-center col-span-1">
                    <div className="relative w-14 h-14">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${
                          item.menuItem?.imageUrl || ""
                        }?v=${item.menuItem?.imageVersion || 0}`}
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
                  <div className="flex flex-col items-center justify-center col-span-2 text-sm">
                    {item.selectedOptions.map((option, optionIndex) => (
                      <div key={optionIndex}>
                        {option.name} ({getCurrency(option.price, "JPY")})
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center col-span-1 text-sm">
                    {convertDatesToIntlString(item.createdAt, {
                      onlyTime: true,
                    })}
                  </div>
                  <div className="flex items-center justify-center col-span-1">
                    {getCurrency(totalItemPrice, "JPY")}
                  </div>
                </div>
              );
            })}
          <div className="text-lg font-semibold text-white">
            Total Quantity Ordered: {getAllQuantityOfOrderItems(orderItemData)}
          </div>
        </div>
      )}
    </div>
  );
}
