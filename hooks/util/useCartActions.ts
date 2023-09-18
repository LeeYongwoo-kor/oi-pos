import { CART_ITEM_MAX_STORAGE } from "@/constants/menu";
import { CartItem, cartItemState } from "@/recoil/state/cartItemState";
import { addToCartItem } from "@/utils/menu/cartItemStorage";
import { useRecoilState } from "recoil";

export const useCartActions = () => {
  const [cart, setCart] = useRecoilState(cartItemState);

  const addCartItem = (item: CartItem): boolean => {
    if (cart.length < CART_ITEM_MAX_STORAGE) {
      const newCart = [...cart, item];
      setCart(newCart);
      addToCartItem(newCart);
      return true;
    }
    return false;
  };

  const removeCartItem = async (index: number): Promise<void> => {
    const newCart = [...cart.slice(0, index), ...cart.slice(index + 1)];
    setCart(newCart);
    addToCartItem(newCart);
  };

  const updateCartItem = async (
    index: number,
    updatedItem: CartItem
  ): Promise<void> => {
    const newCart = [...cart];
    newCart[index] = updatedItem;
    setCart(newCart);
    addToCartItem(newCart);
  };

  const removeCartItemById = (menuId: string): void => {
    const itemExists = cart.some((item) => item.menuId === menuId);
    if (itemExists) {
      const newCart = cart.filter((item) => item.menuId !== menuId);
      setCart(newCart);
      addToCartItem(newCart);
    }
  };

  return { addCartItem, removeCartItem, removeCartItemById, updateCartItem };
};
