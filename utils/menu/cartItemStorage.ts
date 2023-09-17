import { CART_ITEM_STORAGE_KEY } from "@/constants/menu";
import { CartItem } from "@/recoil/state/cartItemState";

export const getCartItems = (): CartItem[] => {
  if (typeof window === "undefined") {
    return [];
  }
  const cart = localStorage.getItem(CART_ITEM_STORAGE_KEY);
  return cart ? JSON.parse(cart) : [];
};

export const addToCartItem = (item: CartItem[]) => {
  // const cartItems = getCartItems();
  // cartItems.push(item);
  localStorage.setItem(CART_ITEM_STORAGE_KEY, JSON.stringify(item));
};

export const removeFromCartItem = (menuId: string) => {
  let cartItems = getCartItems();
  cartItems = cartItems.filter((item) => item.menuId !== menuId);
  localStorage.setItem(CART_ITEM_STORAGE_KEY, JSON.stringify(cartItems));
};

export const updateCartItem = (updatedItem: CartItem) => {
  let cartItems = getCartItems();
  cartItems = cartItems.map((item) =>
    item.menuId === updatedItem.menuId ? updatedItem : item
  );
  localStorage.setItem(CART_ITEM_STORAGE_KEY, JSON.stringify(cartItems));
};
