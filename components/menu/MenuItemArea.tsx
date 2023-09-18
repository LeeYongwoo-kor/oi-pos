import { IMenuItem } from "@/database";
import { menuItemsSelector } from "@/recoil/selector/menuSelector";
import {
  editingState,
  mobileState,
  selectedEditMenuState,
  selectedMenuState,
  showMenuDetailState,
  showMenuEditState,
} from "@/recoil/state/menuState";
import getCurrency from "@/utils/menu/getCurrencyFormat";
import {
  faCirclePlus,
  faPenToSquare,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MenuItemStatus } from "@prisma/client";
import Image from "next/image";
import { useRecoilCallback, useRecoilValue } from "recoil";

export default function MenuItemArea() {
  const isMobile = useRecoilValue(mobileState);
  const isEditing = useRecoilValue(editingState);
  const dishes = useRecoilValue(menuItemsSelector);
  const dishesCheck =
    !isEditing && dishes.length === 0
      ? "flex items-center justify-center"
      : "grid gap-3";
  const responsiveStyle = isEditing
    ? isMobile
      ? "grid-cols-2"
      : "grid-cols-3"
    : "sm:grid-cols-2 md:grid-cols-3";

  const handleEditMenu = useRecoilCallback(
    ({ set }) =>
      (dish: IMenuItem | null) => {
        if (!isEditing) {
          return;
        }
        set(selectedEditMenuState, dish);
        set(showMenuEditState, true);
      },
    [isEditing]
  );

  const handleShowCart = useRecoilCallback(
    ({ set }) =>
      (dish: IMenuItem) => {
        if (isEditing) {
          return;
        }
        set(selectedMenuState, dish);
        set(showMenuDetailState, true);
      },
    [isEditing]
  );

  return (
    <div
      className={`overflow-y-scroll max-h-[34rem] scrollbar-hide ${responsiveStyle} ${dishesCheck}`}
    >
      {dishes.map((dish) => (
        <div
          key={dish.id}
          className={`relative flex flex-col rounded-lg shadow-md mb-1 ${
            isEditing ? "cursor-pointer hover-wrapper" : ""
          }`}
        >
          {isEditing && (
            <div className="hidden edit-icon">
              <button
                onClick={() => handleEditMenu(dish)}
                className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
              >
                <FontAwesomeIcon
                  className="text-white"
                  size="2x"
                  icon={faPenToSquare}
                />
              </button>
            </div>
          )}
          {isEditing && (
            <div onClick={() => handleEditMenu(dish)} className="overlay" />
          )}
          <div className="relative h-40">
            {dish.status === MenuItemStatus.SOLD_OUT && (
              <div className="absolute z-10 text-2xl italic font-bold transform -translate-x-1/2 -translate-y-1/2 text-slate-800 top-1/2 left-1/2">
                SOLD OUT
              </div>
            )}
            <Image
              src={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${
                dish.imageUrl || ""
              }?v=${dish.imageVersion}`}
              alt={dish.name}
              fill
              className={`object-cover rounded-lg ${
                dish.status === MenuItemStatus.SOLD_OUT
                  ? "grayscale opacity-30"
                  : ""
              }`}
              draggable={false}
            />
          </div>
          <div className="flex justify-between">
            <div className="flex flex-col py-2 pl-2">
              <h3 className="text-xl font-semibold">{dish.name}</h3>
              <p className="text-base font-medium text-gray-500">
                {getCurrency(dish.price, "JPY")}
              </p>
            </div>
            {dish.status !== MenuItemStatus.SOLD_OUT && (
              <div className="py-3 mr-2 w-14">
                <button
                  onClick={() => handleShowCart(dish)}
                  className="w-full h-full text-white bg-red-500 rounded-full hover:bg-red-600"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
      {/* Add new dish button */}
      {isEditing && (
        <button
          onClick={() => handleEditMenu(null)}
          className="flex flex-col items-center justify-center h-56 p-4 m-1 space-y-2 border-4 border-dotted hover:text-slate-500 text-slate-400 border-slate-300 hover:border-slate-400"
        >
          <FontAwesomeIcon size="2x" icon={faCirclePlus} />
          <span className="text-lg font-semibold">Add new dish</span>
        </button>
      )}
      {/* If there is no menu registered */}
      {!isEditing && dishes.length === 0 && (
        <div className="h-full m-5 text-xl font-bold text-gray-600">
          The menu currently registered does not exist
        </div>
      )}
    </div>
  );
}
