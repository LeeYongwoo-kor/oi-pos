import { atom } from "recoil";

export interface ICartItem {
  menuId: string;
  categoryId: string;
  quantity: number;
  selectedOptions: string[];
}

export const cartItemState = atom<ICartItem[]>({
  key: "cartItem",
  default: [],
});

export const showCartItemState = atom<boolean>({
  key: "showCartItemState",
  default: false,
});
