import { OrderStatus } from "@prisma/client";
import { atom } from "recoil";

export interface IOrderInfo {
  orderId: string;
  orderStatus: OrderStatus;
  tableId: string;
  tableNumber: number;
}

export const orderInfoState = atom<IOrderInfo | null>({
  key: "orderInfoState",
  default: null,
});
