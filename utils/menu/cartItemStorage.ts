import { CART_ITEM_STORAGE_KEY } from "@/constants/menu";
import { ICartItem } from "@/recoil/state/cartItemState";

export const getCartStorage = (): ICartItem[] => {
  if (typeof window === "undefined") {
    return [];
  }
  const cart = localStorage.getItem(CART_ITEM_STORAGE_KEY);
  return cart ? JSON.parse(cart) : [];
};

export const addToCartStorage = (item: ICartItem[]) => {
  localStorage.setItem(CART_ITEM_STORAGE_KEY, JSON.stringify(item));
};

export const removeFromCartStorage = (menuId: string) => {
  let cartItems = getCartStorage();
  cartItems = cartItems.filter((item) => item.menuId !== menuId);
  localStorage.setItem(CART_ITEM_STORAGE_KEY, JSON.stringify(cartItems));
};

export const updateCartStorage = (updatedItem: ICartItem) => {
  let cartItems = getCartStorage();
  cartItems = cartItems.map((item) =>
    item.menuId === updatedItem.menuId ? updatedItem : item
  );
  localStorage.setItem(CART_ITEM_STORAGE_KEY, JSON.stringify(cartItems));
};

export const removeAllCartStorage = () => {
  localStorage.removeItem(CART_ITEM_STORAGE_KEY);
};
