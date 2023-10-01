import { IOrderItem } from "@/database";
import isEmpty from "../validation/isEmpty";

export function calculateTotalPrice(
  orderItem: IOrderItem[] | null | undefined
) {
  if (!orderItem || isEmpty(orderItem)) {
    return 0;
  }

  return orderItem.reduce((totalItemAcc, item) => {
    const totalItemPrice = calculateTotalItemPrice(item);
    return totalItemAcc + totalItemPrice;
  }, 0);
}

export function calculateTotalItemPrice(orderItem: IOrderItem | undefined) {
  if (!orderItem || isEmpty(orderItem)) {
    return 0;
  }

  const totalOptionPrice = orderItem.selectedOptions.reduce(
    (totalOptionAcc, option) => totalOptionAcc + option.price,
    0
  );

  return (orderItem.price + totalOptionPrice) * orderItem.quantity;
}
