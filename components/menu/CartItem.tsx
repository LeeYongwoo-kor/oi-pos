import {
  CART_ENDPOINT,
  ME_ENDPOINT,
  RESTAURANT_ORDER_ENDPOINT,
} from "@/constants/endpoint";
import { Method } from "@/constants/fetch";
import { CART_ITEM_MAX_QUANTITY } from "@/constants/menu";
import { CreateOrderItemOptionParams, IMenuItem } from "@/database";
import useLoading from "@/hooks/context/useLoading";
import { useToast } from "@/hooks/useToast";
import { useCartActions } from "@/hooks/util/useCartActions";
import useMutation from "@/lib/client/useMutation";
import { fetcher } from "@/pages/_app";
import { IPostRestaurantTableOrderBody } from "@/pages/api/v1/restaurants/tables/[restaurantTableId]/orders/[orderId]/requests";
import {
  ICartItem,
  cartItemState,
  showCartItemState,
} from "@/recoil/state/cartItemState";
import { orderInfoState } from "@/recoil/state/orderState";
import { getCartStorage } from "@/utils/menu/cartItemStorage";
import createAndValidateEncodedUrl from "@/utils/menu/createAndValidateEncodedUrl";
import getCurrency from "@/utils/menu/getCurrencyFormat";
import isEmpty from "@/utils/validation/isEmpty";
import isFormChanged from "@/utils/validation/isFormChanged";
import { faMinus, faPlus, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { OrderRequest, OrderRequestStatus } from "@prisma/client";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import useSWRMutation from "swr/mutation";
import Loader from "../Loader";
import BottomSheet from "../ui/BottomSheet";
import getCloudImageUrl from "@/utils/menu/getCloudImageUrl";

type CartItemProps = {
  restaurantId: string | undefined | null;
};

const calculateItemTotalPrice = (cartItem: ICartItem, apiItem: IMenuItem) => {
  if (isEmpty(cartItem) || isEmpty(apiItem)) {
    return 0;
  }

  const optionPrice = cartItem?.selectedOptions?.reduce((acc, optionId) => {
    const option = apiItem?.menuItemOptions?.find((o) => o.id === optionId);
    return acc + (option ? option.price : 0);
  }, 0);

  return cartItem?.quantity * (apiItem.price + optionPrice);
};

export default function Cart({ restaurantId }: CartItemProps) {
  const cartItems = useRecoilValue(cartItemState);
  const orderInfo = useRecoilValue(orderInfoState);
  const [isVisible, openCartItem] = useRecoilState(showCartItemState);
  const {
    trigger,
    data: freshCartData,
    error: freshCartErr,
    isMutating: freshCartLoading,
  } = useSWRMutation<IMenuItem[]>(
    cartItemState && !isEmpty(cartItemState)
      ? createAndValidateEncodedUrl(cartItems, CART_ENDPOINT.MENU_ITEM)
      : null,
    fetcher
  );
  const [
    createOrderRequest,
    { error: createOrderRequestErr, loading: createOrderRequestLoading },
  ] = useMutation<OrderRequest, IPostRestaurantTableOrderBody>(
    orderInfo
      ? RESTAURANT_ORDER_ENDPOINT.ORDER_REQUEST(
          orderInfo.tableId,
          orderInfo.orderId
        )
      : null,
    Method.POST
  );

  const [totalPrice, setTotalPrice] = useState(0);
  const {
    removeCartItem,
    updateCartItem,
    removeCartItemById,
    removeAllCartItems,
  } = useCartActions();
  const { addToast } = useToast();
  const withLoading = useLoading();

  const isDisabled = !orderInfo || isEmpty(orderInfo) || freshCartLoading;

  const validateCartItems = useCallback(
    (cartItems: ICartItem[], apiData: IMenuItem[]): string[] => {
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
    if (getCartStorage().length === 0) {
      handleCloseCartItem();
    }
  };

  const handleCloseCartItem = () => {
    openCartItem(false);
  };

  const handleOrderRequest = async () => {
    if (
      createOrderRequestLoading ||
      !restaurantId ||
      !totalPrice ||
      !orderInfo ||
      isEmpty(orderInfo) ||
      !freshCartData ||
      isEmpty(freshCartData)
    ) {
      return;
    }

    cartItems.forEach((item, index) => {
      const { categoryId, menuId } = item;
      if (
        isFormChanged(
          {
            categoryId,
            menuId,
          },
          {
            categoryId: freshCartData[index].categoryId,
            menuId: freshCartData[index].id,
          }
        )
      ) {
        addToast(
          "error",
          "You have kept open the cart for a long time. Please refresh the page and try again"
        );
        return;
      }
    });

    const orderRequestBody: IPostRestaurantTableOrderBody = {
      orderItemInfo: cartItems.map((item, index) => {
        let selectedOptions: CreateOrderItemOptionParams[] = [];

        if (item.selectedOptions && !isEmpty(item.selectedOptions)) {
          selectedOptions = freshCartData[index]?.menuItemOptions
            ?.map((opt) => ({
              menuItemOptionId: opt.id,
              name: opt.name,
              price: opt.price,
            }))
            .filter((opt) =>
              item.selectedOptions.includes(opt.menuItemOptionId)
            );
        }

        return {
          menuItemId: item.menuId,
          quantity: item.quantity,
          name: freshCartData[index].name,
          price: freshCartData[index].price,
          selectedOptions,
        };
      }),
      status: OrderRequestStatus.PLACED,
    };

    const result = await createOrderRequest(orderRequestBody, {
      additionalKeys: [ME_ENDPOINT.ORDER_REQUEST],
    });
    if (result) {
      removeAllCartItems();
      handleCloseCartItem();
      addToast("success", "Order request has been sent successfully!");
    }
  };

  useEffect(() => {
    trigger();
  }, []);

  useEffect(() => {
    if (freshCartData && freshCartData.length === cartItems.length) {
      const missingItemIds = validateCartItems(cartItems, freshCartData);
      if (missingItemIds.length > 0) {
        missingItemIds.forEach((id) => removeCartItemById(id));
        addToast(
          "error",
          `${missingItemIds.length} items are missing or not currently sold`
        );
      }

      let newTotalPrice = 0;
      freshCartData.forEach((apiItem, index) => {
        const cartItem = cartItems[index];
        const totalPrice = calculateItemTotalPrice(cartItem, apiItem);
        newTotalPrice += totalPrice;
      });

      setTotalPrice(newTotalPrice);
    }

    if (cartItems.length === 0) {
      handleCloseCartItem();
    }
  }, [freshCartData, cartItems]);

  useEffect(() => {
    if (createOrderRequestErr) {
      addToast("error", createOrderRequestErr.message);
    }
  }, [createOrderRequestErr]);

  useEffect(() => {
    if (freshCartErr) {
      removeAllCartItems();
      handleCloseCartItem();
      addToast("error", freshCartErr.message);
    }
  }, [freshCartErr]);

  return (
    <BottomSheet handleState={[isVisible, openCartItem]}>
      <div className="flex flex-col items-center justify-between sm:px-2">
        {freshCartLoading ? (
          <Loader color="white" />
        ) : (
          <div className="grid w-full grid-cols-1 gap-4">
            {freshCartData &&
              freshCartData.map((apiItem, index) => {
                const cartItem = cartItems[index];
                const itemTotalPrice = calculateItemTotalPrice(
                  cartItem,
                  apiItem
                );

                return (
                  <div
                    key={apiItem.id + index}
                    className="relative flex items-center justify-between px-2 py-2 bg-white rounded shadow sm:px-4"
                  >
                    {/* image*/}
                    <div className="flex w-[60%] sm:w-[35%]">
                      <div className="relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20">
                        <Image
                          src={getCloudImageUrl(
                            apiItem.imageUrl,
                            apiItem.imageVersion
                          )}
                          alt={apiItem.name || "menuName"}
                          quality={50}
                          fill
                          className="object-cover w-full rounded-full"
                          draggable={false}
                        />
                      </div>
                      {/* name. price */}
                      <div className="flex flex-col justify-center flex-grow w-full ml-2 text-base sm:ml-4 sm:text-lg sm:cart-item-truncate-width">
                        <h2 className="w-full max-w-full font-semibold truncate">
                          {apiItem.name}
                        </h2>
                        <p className="hidden font-bold sm:block">
                          {getCurrency(apiItem.price, "JPY")}
                        </p>
                        <p className="block font-bold sm:hidden">
                          {getCurrency(itemTotalPrice, "JPY")}
                        </p>
                        <p className="block -mt-1 sm:hidden">
                          {cartItems[index]?.selectedOptions?.length > 0 &&
                            cartItems[index].selectedOptions.map((optionId) => {
                              const option = apiItem?.menuItemOptions?.find(
                                (o) => o.id === optionId
                              );
                              if (!option) {
                                return null;
                              }
                              return (
                                <span
                                  key={option.id}
                                  className="w-fit h-4 inline-flex items-center px-0.5 text-[0.5rem] text-white bg-amber-600 rounded-xl"
                                >
                                  {option.name}
                                </span>
                              );
                            })}
                        </p>
                      </div>
                    </div>
                    {/* quantity */}
                    <div className="flex w-[40%] sm:w-[20%]">
                      <div className="flex items-center font-bold">
                        <button
                          onClick={() =>
                            handleQuantityChange(index, cartItem.quantity - 1)
                          }
                          className="px-3 py-1.5 text-white bg-red-500 rounded-full hover:bg-red-600"
                        >
                          <FontAwesomeIcon
                            className="text-sm sm:text-base"
                            icon={faMinus}
                          />
                        </button>
                        <span className="mx-2 text-xl sm:mx-3">
                          {cartItems[index]?.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleQuantityChange(index, cartItem.quantity + 1)
                          }
                          className="px-3 py-1.5 text-white bg-red-500 rounded-full hover:bg-red-600"
                        >
                          <FontAwesomeIcon
                            className="text-sm sm:text-base"
                            icon={faPlus}
                          />
                        </button>
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col w-[40%] sm:flex-row sm:w-[45%]">
                      {/* options */}
                      <div className="flex items-center text-xs sm:flex-col sm:w-2/3 sm:text-base">
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
                                {option.name} (
                                {getCurrency(option.price, "JPY")})
                              </div>
                            );
                          })}
                      </div>
                      {/* item price */}
                      <div className="hidden w-1/3 sm:flex sm:flex-col">
                        <label className="hidden sm:block">Item Price</label>
                        <p className="text-lg font-bold">
                          {getCurrency(itemTotalPrice, "JPY")}
                        </p>
                      </div>
                    </div>
                    {/* delete button */}
                    <div className="absolute transform -translate-y-1/2 top-1/2 right-3">
                      <button
                        onClick={() => handleDeleteItem(index)}
                        className="ml-2 text-red-600 hover:text-red-700"
                      >
                        <FontAwesomeIcon
                          className="w-6 h-6 sm:w-8 sm:h-8"
                          icon={faTrashCan}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
      <div className="flex self-end justify-center w-full mt-4">
        <div className="text-lg font-bold text-white">
          Total Price: {getCurrency(totalPrice, "JPY")}
        </div>
        <button
          disabled={isDisabled}
          onClick={async (e) => {
            e.preventDefault();
            await withLoading(() => handleOrderRequest());
          }}
          className={`w-full px-4 py-2 text-lg font-semibold bg-green-500 text-white rounded-full  ${
            isDisabled ? "opacity-75 cursor-not-allowed" : "hover:bg-green-600"
          }`}
        >
          Order
        </button>
      </div>
    </BottomSheet>
  );
}
