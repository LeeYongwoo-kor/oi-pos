import { CART_ENDPOINT } from "@/constants/endpoint";
import { CART_ITEM_MAX_QUANTITY } from "@/constants/menu";
import { IMenuItem } from "@/database";
import { useToast } from "@/hooks/useToast";
import { useCartActions } from "@/hooks/util/useCartActions";
import { fetcher } from "@/pages/_app";
import { CartItem, cartItemState } from "@/recoil/state/cartItemState";
import { showCartItemState } from "@/recoil/state/menuState";
import { getCartItems } from "@/utils/menu/cartItemStorage";
import createAndValidateEncodedUrl from "@/utils/menu/createAndValidateEncodedUrl";
import getCurrency from "@/utils/menu/getCurrencyFormat";
import isEmpty from "@/utils/validation/isEmpty";
import { faMinus, faPlus, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import useSWRMutation from "swr/mutation";
import Loader from "../Loader";

const calculateItemTotalPrice = (cartItem: CartItem, apiItem: IMenuItem) => {
  const optionPrice = cartItem?.selectedOptions?.reduce((acc, optionId) => {
    const option = apiItem?.menuItemOptions?.find((o) => o.id === optionId);
    return acc + (option ? option.price : 0);
  }, 0);

  return cartItem?.quantity * (apiItem.price + optionPrice);
};

export default function Cart() {
  const cartItems = useRecoilValue(cartItemState);
  const [isVisible, openCartItem] = useRecoilState(showCartItemState);
  const { trigger, data, error, isMutating } = useSWRMutation<IMenuItem[]>(
    cartItemState && !isEmpty(cartItemState)
      ? createAndValidateEncodedUrl(cartItems, CART_ENDPOINT.MENU_ITEM)
      : null,
    fetcher
  );
  const [totalPrice, setTotalPrice] = useState(0);
  const { removeCartItem, updateCartItem, removeCartItemById } =
    useCartActions();
  const { addToast } = useToast();

  const validateCartItems = useCallback(
    (cartItems: CartItem[], apiData: IMenuItem[]): string[] => {
      return cartItems.reduce((acc: string[], cartItem) => {
        const apiItem = apiData.find((item) => item?.id === cartItem.menuId);
        if (!apiItem) {
          return [...(acc || []), cartItem.menuId];
        }

        return acc;
      }, []);
    },
    []
  );

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity > CART_ITEM_MAX_QUANTITY || newQuantity < 1) {
      return;
    }

    const updatedItem = { ...cartItems[index], quantity: newQuantity };
    updateCartItem(index, updatedItem);
  };

  const handleDeleteItem = async (index: number) => {
    await removeCartItem(index);
    await trigger();
    if (getCartItems().length === 0) {
      handleCloseCartItem();
    }
  };

  const handleCloseCartItem = () => {
    openCartItem(false);
  };

  console.log("data", data);
  console.log("cartItems", cartItems);

  useEffect(() => {
    trigger();
  }, []);

  useEffect(() => {
    if (data && data.length === cartItems.length) {
      const missingItemIds = validateCartItems(cartItems, data);
      if (missingItemIds.length > 0) {
        missingItemIds.forEach((id) => removeCartItemById(id));
        addToast(
          "error",
          `${missingItemIds.length} items are missing or not currently sold`
        );
      }

      let newTotalPrice = 0;
      data.forEach((apiItem, index) => {
        const cartItem = cartItems[index];
        const totalPrice = calculateItemTotalPrice(cartItem, apiItem);
        newTotalPrice += totalPrice;
      });

      setTotalPrice(newTotalPrice);
    }

    if (cartItems.length === 0) {
      handleCloseCartItem();
    }
  }, [data, cartItems]);

  useEffect(() => {
    if (error) {
      addToast("error", error.message);
    }
  }, [error]);

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 transform transition-transform duration-300 ease-in-out ${
        isVisible ? "z-30" : "z-0"
      }`}
      style={{
        transform: `translateY(${isVisible ? "0%" : "100%"})`,
      }}
    >
      {isVisible && (
        <div className="flex flex-col h-fit p-4 rounded-t-[2rem] scrollbar-hide bg-slate-700 overflow-y-auto">
          <div className="flex justify-between mb-5 sm:mb-4">
            <button
              onClick={handleCloseCartItem}
              className="w-full py-1 text-lg font-semibold text-black bg-gray-200 border-2 border-white rounded-full hover:bg-gray-300"
            >
              Back
            </button>
          </div>
          <div className="flex flex-col items-center justify-between px-2">
            {/* {isValidating ? ( */}
            {isMutating ? (
              <Loader color="white" />
            ) : (
              <div className="grid w-full grid-cols-1 gap-4">
                {data &&
                  data.map((apiItem, index) => {
                    const cartItem = cartItems[index];
                    const itemTotalPrice = calculateItemTotalPrice(
                      cartItem,
                      apiItem
                    );

                    return (
                      <div
                        key={apiItem.id + index}
                        className="flex justify-between px-4 py-2 bg-white rounded shadow"
                      >
                        <div className="flex">
                          <div className="relative w-20 h-20">
                            <Image
                              src={`${
                                process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL
                              }/${apiItem.imageUrl || ""}?v=${
                                apiItem.imageVersion || 0
                              }`}
                              alt={apiItem.name || "menuName"}
                              quality={50}
                              fill
                              className="object-cover w-full rounded-full"
                              draggable={false}
                            />
                          </div>
                          <div className="ml-4">
                            <h2 className="text-lg font-semibold">
                              {apiItem.name}
                            </h2>
                            <p className="text-lg font-bold">
                              {getCurrency(apiItem.price, "JPY")}
                            </p>
                          </div>
                        </div>
                        <div className="flex font-bold">
                          <div className="flex items-center">
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  index,
                                  cartItem.quantity - 1
                                )
                              }
                              className="px-3 py-1.5 text-white bg-red-500 rounded-full hover:bg-red-600"
                            >
                              <FontAwesomeIcon icon={faMinus} />
                            </button>
                            <span className="mx-3 text-xl">
                              {cartItems[index]?.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  index,
                                  cartItem.quantity + 1
                                )
                              }
                              className="px-3 py-1.5 text-white bg-red-500 rounded-full hover:bg-red-600"
                            >
                              <FontAwesomeIcon icon={faPlus} />
                            </button>
                          </div>
                        </div>
                        <div className="text-sm">
                          {cartItems[index]?.selectedOptions?.length > 0 &&
                            cartItems[index].selectedOptions.map((optionId) => {
                              const option = apiItem?.menuItemOptions?.find(
                                (o) => o.id === optionId
                              );
                              if (!option) {
                                return null;
                              }
                              return (
                                <div key={optionId}>
                                  {option.name} -{" "}
                                  {getCurrency(option.price, "JPY")}
                                </div>
                              );
                            })}
                        </div>
                        <div className="">
                          <label>Item Price</label>
                          <p className="text-lg font-bold">
                            {getCurrency(itemTotalPrice, "JPY")}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteItem(index)}
                          className="ml-6 text-red-500"
                        >
                          <FontAwesomeIcon size="2x" icon={faTrashCan} />
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
            <div className="flex self-end justify-center w-full mt-4">
              <div className="text-lg font-bold text-white">
                Total Price: {getCurrency(totalPrice, "JPY")}
              </div>
              <button className="w-full px-4 py-2 text-lg font-semibold text-white bg-green-500 rounded-full hover:bg-green-600">
                Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
