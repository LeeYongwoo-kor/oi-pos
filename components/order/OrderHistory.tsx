import { IOrderItemForHistory } from "@/database";
import {
  orderInfoState,
  showOrderHistoryState,
} from "@/recoil/state/orderState";
import getCurrency from "@/utils/menu/getCurrencyFormat";
import isEmpty from "@/utils/validation/isEmpty";
import { SetStateAction, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import BottomSheet from "../ui/BottomSheet";
import OrderHistoryDetail from "./OrderHistoryDetail";
import { calculateTotalPrice } from "@/utils/order/setDefaultMenuOptions";

type CartItemProps = {
  restaurantId: string | undefined | null;
};

export default function Cart({ restaurantId }: CartItemProps) {
  const orderInfo = useRecoilValue(orderInfoState);
  const [isVisible, openOrderHistory] = useRecoilState(showOrderHistoryState);
  const [sharedOrderItemData, setSharedOrderItemData] = useState<
    IOrderItemForHistory[] | null
  >(null);

  const isDisabled = !sharedOrderItemData || isEmpty(sharedOrderItemData);

  const handleOrderItemDataChange = (
    newData: SetStateAction<IOrderItemForHistory[] | null>
  ) => {
    setSharedOrderItemData(newData);
  };

  return (
    <BottomSheet handleState={[isVisible, openOrderHistory]}>
      <OrderHistoryDetail
        tableId={orderInfo?.tableId}
        orderId={orderInfo?.orderId}
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
          onClick={async (e) => {
            e.preventDefault();
            // await withLoading(() => handleOrderRequest());
          }}
          className={`w-full px-4 py-2 text-lg font-semibold bg-blue-500 text-white rounded-full  ${
            isDisabled ? "opacity-75 cursor-not-allowed" : "hover:bg-blue-600"
          }`}
        >
          Payment Request
        </button>
      </div>
    </BottomSheet>
  );
}
