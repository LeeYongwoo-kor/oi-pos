import { atom } from "recoil";

export type CartItem = {
  menuId: string;
  categoryId: string;
  quantity: number;
  selectedOptions: string[];
};

export const cartItemState = atom<CartItem[]>({
  key: "cartItem",
  default: [],
});
