import { CART_ITEM_MAX_QUANTITY } from "@/constants/menu";
import { useToast } from "@/hooks/useToast";
import { useCartActions } from "@/hooks/util/useCartActions";
import {
  selectedMenuState,
  showMenuDetailState,
} from "@/recoil/state/menuState";
import getCurrency from "@/utils/menu/getCurrencyFormat";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";

const getCheckedOptions = (isChecked: { [key: string]: boolean }) => {
  return Object.keys(isChecked).filter((key) => isChecked[key]);
};

export default function MenuDetail() {
  const { addCartItem } = useCartActions();
  const [isVisible, openMenuDetail] = useRecoilState(showMenuDetailState);
  const selectedMenu = useRecoilValue(selectedMenuState);
  const [quantity, setQuantity] = useState(1);
  const [isChecked, setIsChecked] = useState<{ [key: string]: boolean }>({});
  const [totalPrice, setTotalPrice] = useState(0);
  const { addToast } = useToast();

  const handleCloseMenuDetail = () => {
    openMenuDetail(false);
  };

  const handleAddToCart = (
    menuId: string | undefined,
    categoryId: string | undefined
  ) => {
    if (!menuId || !categoryId) {
      addToast("error", "Something went wrong! Please try again later");
      handleCloseMenuDetail();
      return;
    }

    const newItem = {
      menuId,
      categoryId,
      quantity,
      selectedOptions: getCheckedOptions(isChecked),
    };

    const addResult = addCartItem(newItem);
    if (!addResult) {
      addToast("error", "You can only add up to 4 items to cart at a time!");
      return;
    }

    addToast("success", "Added to Cart Successfully!");
    handleCloseMenuDetail();
  };

  const handleCheckboxChange = (optionId: string) => {
    setIsChecked({
      ...isChecked,
      [optionId]: !isChecked[optionId],
    });
  };

  const handleQuantityChange = (change: number) => {
    setQuantity(
      Math.min(CART_ITEM_MAX_QUANTITY, Math.max(1, quantity + change))
    );
  };

  useEffect(() => {
    let price = selectedMenu?.price || 0;
    price *= quantity;

    Object.keys(isChecked).forEach((key) => {
      if (isChecked[key]) {
        const option = selectedMenu?.menuItemOptions.find(
          (opt) => opt.id === key
        );
        if (option) {
          price += option.price * quantity;
        }
      }
    });

    setTotalPrice(price);
  }, [isChecked, quantity, selectedMenu]);

  useEffect(() => {
    if (!isVisible) {
      setIsChecked({});
      setQuantity(1);
    }
  }, [isVisible]);

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
        <div className="flex flex-col sm:h-112 p-4 rounded-t-[2rem] scrollbar-hide bg-slate-700 overflow-y-auto">
          <div className="flex justify-between mb-5 sm:mb-8">
            <button
              onClick={handleCloseMenuDetail}
              className="w-full py-1 text-lg font-semibold text-black bg-gray-200 border-2 border-white rounded-full hover:bg-gray-300"
            >
              Back
            </button>
          </div>
          <div className="flex flex-col justify-around px-2 space-x-0 sm:px-6 sm:flex-row sm:space-x-8">
            <div className="relative w-full h-64 mb-4 sm:flex-1 sm:h-80 sm:w-80 sm:mb-0">
              <Image
                src={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${
                  selectedMenu?.imageUrl || ""
                }?v=${selectedMenu?.imageVersion || 0}`}
                alt={selectedMenu?.name || "menuName"}
                fill
                className="object-cover w-full border-2 border-gray-200 rounded-3xl"
                draggable={false}
              />
            </div>
            <div className="flex flex-col justify-between flex-1 text-slate-100">
              <div className="break-all">
                <h2 className="text-3xl font-bold">{selectedMenu?.name}</h2>
                <p className="text-lg indent-0.5 text-slate-200">
                  {selectedMenu?.description}
                </p>
              </div>
              <p className="text-2xl font-bold">
                {getCurrency(totalPrice, "JPY")} JPY
              </p>
              <div className="flex items-center font-bold">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="px-4 py-2 text-white bg-red-500 rounded-full hover:bg-red-600"
                >
                  <FontAwesomeIcon icon={faMinus} />
                </button>
                <span className="mx-4 text-xl">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="px-4 py-2 text-white bg-red-500 rounded-full hover:bg-red-600"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
              <div className="flex flex-col mt-4">
                {selectedMenu?.menuItemOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-y-1">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isChecked[option.id] || false}
                        onChange={() => handleCheckboxChange(option.id)}
                      />
                      <span
                        className={`w-5 h-5 mr-1 border rounded cursor-pointer flex justify-center items-center ${
                          isChecked[option.id] ? "bg-red-500" : "bg-white"
                        }`}
                      >
                        {isChecked[option.id] && (
                          <span className="text-xs text-white">✓</span>
                        )}
                      </span>
                    </label>
                    <span className="ml-2">
                      {option.name} (+{option.price} JPY)
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() =>
                  handleAddToCart(selectedMenu?.id, selectedMenu?.categoryId)
                }
                className="px-4 py-2 mt-4 text-lg text-white bg-green-500 rounded-full hover:bg-green-600"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
