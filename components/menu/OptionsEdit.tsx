/* eslint-disable @next/next/no-img-element */
import { CONFIRM_DIALOG_MESSAGE } from "@/constants/message/confirm";
import { useConfirm } from "@/hooks/useConfirm";
import { EditMenuFormAction } from "@/reducers/menu/editMenuFormReducer";
import { EditOptionsAction } from "@/reducers/menu/editOptionsReducer";
import { MenuCategoryEditAction } from "@/reducers/menu/menuCategoryEditReducer";
import { MenuItemEditAction } from "@/reducers/menu/menuItemEditReducer";
import validateMenuOptions, {
  MenuItemOptionForm,
  initialMenuOptions,
} from "@/utils/menu/validateMenuOptions";
import { MenuCategoryStatus, MenuItemStatus } from "@prisma/client";
import { Dispatch } from "react";

type MenuStatusKind = "category" | "item";
type MenuStatus = MenuCategoryStatus | MenuItemStatus;
type MenuAction = MenuCategoryEditAction | MenuItemEditAction;
type MenuStatusParams = {
  type: MenuStatusKind;
  status: MenuStatus;
};

interface MenuOptionsInfo {
  options: MenuItemOptionForm[];
  menuStatus: MenuStatusParams;
  maxDailyOrders?: number | null;
}

type OptionsEditProps<T> = {
  optionsInfo: MenuOptionsInfo;
  dispatch: Dispatch<T>;
};

export default function OptionsEdit<T extends MenuAction>({
  optionsInfo: {
    options,
    menuStatus: { type, status: paramStatus },
    maxDailyOrders,
  },
  dispatch,
}: OptionsEditProps<T>) {
  const { showConfirm } = useConfirm();

  const statusKeys =
    type === "category"
      ? Object.keys(MenuCategoryStatus)
      : Object.keys(MenuItemStatus);

  const dispatchMenuStatus = <T extends MenuStatus>(
    type: "category" | "item",
    status: T,
    dispatch: React.Dispatch<MenuAction>
  ) => {
    if (type === "category") {
      dispatch({
        type: "SET_MENU_CATEGORY_STATUS",
        payload: status,
      } as MenuCategoryEditAction);
    } else if (type === "item") {
      dispatch({
        type: "SET_MENU_ITEM_STATUS",
        payload: status,
      } as MenuItemEditAction);
    }
  };

  const removeOptionAtIndex = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    (dispatch as Dispatch<EditOptionsAction>)({
      type: "HANDLE_REMOVE_OPTION",
      payload: newOptions,
    });
  };

  const handleOptionChange = (
    field: keyof MenuItemOptionForm,
    value: string | number,
    index: number
  ) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    const validatedOptions = validateMenuOptions(newOptions);
    (dispatch as Dispatch<EditOptionsAction>)({
      type: "SET_OPTIONS",
      payload: validatedOptions,
    });
  };

  const handleRemoveOption = (type: MenuStatusKind, index: number) => {
    if (!options[index]?.id && !options[index]?.categoryOptionId) {
      removeOptionAtIndex(index);
      return;
    }

    const messageMap = {
      item: CONFIRM_DIALOG_MESSAGE.DELETE_MENU_OPTION,
      category: CONFIRM_DIALOG_MESSAGE.DELETE_CATEGORY_OPTION,
    };

    const { TITLE, MESSAGE, CONFIRM_TEXT, CANCEL_TEXT } = messageMap[type];

    showConfirm({
      title: TITLE,
      message: MESSAGE,
      confirmText: CONFIRM_TEXT,
      cancelText: CANCEL_TEXT,
      buttonType: "fatal",
      onConfirm: () => removeOptionAtIndex(index),
    });
  };

  return (
    <>
      <div className="flex-wrap mt-2 indent-2">
        <label className="text-lg font-semibold">
          {type === "category" ? "Category" : "Menu Item"} Status:
        </label>
      </div>
      <div className="flex p-2 mt-2 border-2 rounded">
        <div className="flex flex-wrap space-x-2">
          {statusKeys.map((status, idx) => (
            <label key={idx} className="flex items-center p-1 cursor-pointer">
              <input
                type="radio"
                name="menuCategoryStatus"
                value={status}
                checked={paramStatus === status}
                onChange={() =>
                  dispatchMenuStatus(
                    type,
                    status as MenuStatus,
                    dispatch as Dispatch<MenuAction>
                  )
                }
                className="hidden"
              />
              <div
                className={`flex items-center px-2 py-1 border-2 rounded ${
                  paramStatus === status
                    ? "border-blue-500"
                    : "border-gray-300 hover:border-blue-400"
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full ${
                    paramStatus === status ? "bg-blue-500" : "bg-gray-300"
                  }`}
                ></span>
                <span className="ml-2 text-sm">{status}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
      {paramStatus === "LIMITED" && type === "item" && (
        <div className="flex flex-col mt-6">
          <label className="text-lg font-semibold indent-2">
            Max Daily Orders:
          </label>
          <input
            type="number"
            placeholder="Enter max daily orders"
            value={maxDailyOrders ?? 0}
            onChange={(e) =>
              (dispatch as Dispatch<EditMenuFormAction>)({
                type: "SET_MAX_DAILY_ORDERS",
                payload: Number(e.target.value),
              })
            }
            className="w-1/4 p-2 mt-2 border rounded"
          />
        </div>
      )}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-wrap items-center mt-6">
          <h2 className="text-lg font-semibold indent-2">
            {type === "category" ? "Default" : ""} Menu Options
          </h2>
          <button
            onClick={() =>
              (dispatch as Dispatch<EditOptionsAction>)({
                type: "ADD_OPTIONS",
                payload: [...options, initialMenuOptions],
              })
            }
            className="ml-2 px-3 py-1.5 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Add Option +
          </button>
        </div>
        {options.map((option, index) => (
          <div key={index} className="flex flex-col">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Option Name"
                value={option.name}
                onChange={(e) =>
                  handleOptionChange("name", e.target.value, index)
                }
                className="w-1/2 p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Price (+)"
                value={option.price}
                onChange={(e) =>
                  handleOptionChange("price", e.target.value, index)
                }
                className="w-1/4 p-2 border rounded"
              />
              <button
                onClick={() => handleRemoveOption(type, index)}
                className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
              >
                Remove
              </button>
            </div>
            {option.error && (
              <span className="text-sm text-red-500">{option.error}</span>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
