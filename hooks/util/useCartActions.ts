import { CART_ITEM_MAX_STORAGE } from "@/constants/menu";
import { ICartItem, cartItemState } from "@/recoil/state/cartItemState";
import {
  addToCartStorage,
  removeAllCartStorage,
} from "@/utils/menu/cartItemStorage";
import { useRecoilState, useResetRecoilState } from "recoil";

export const useCartActions = () => {
  const [cart, setCart] = useRecoilState(cartItemState);
  const resetCart = useResetRecoilState(cartItemState);

  const addCartItem = (item: ICartItem): boolean => {
    if (cart.length < CART_ITEM_MAX_STORAGE) {
      const newCart = [...cart, item];
      setCart(newCart);
      addToCartStorage(newCart);
      return true;
    }
    return false;
  };

  const removeCartItem = async (index: number): Promise<void> => {
    const newCart = [...cart.slice(0, index), ...cart.slice(index + 1)];
    setCart(newCart);
    addToCartStorage(newCart);
  };

  const updateCartItem = async (
    index: number,
    updatedItem: ICartItem
  ): Promise<void> => {
    const newCart = [...cart];
    newCart[index] = updatedItem;
    setCart(newCart);
    addToCartStorage(newCart);
  };

  const removeCartItemById = (menuId: string): void => {
    const itemExists = cart.some((item) => item.menuId === menuId);
    if (itemExists) {
      const newCart = cart.filter((item) => item.menuId !== menuId);
      setCart(newCart);
      addToCartStorage(newCart);
    }
  };

  const removeAllCartItems = (): void => {
    resetCart();
    removeAllCartStorage();
  };

  return {
    addCartItem,
    removeCartItem,
    removeCartItemById,
    updateCartItem,
    removeAllCartItems,
  };
};
