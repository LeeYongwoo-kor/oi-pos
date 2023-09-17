import { SUB_CATEGORY_VALUE_NONE } from "@/constants/menu";
import { MenuItemStatus } from "@prisma/client";

export interface EditMenuFormState {
  menuName: string;
  price: number;
  description: string;
  subCategory: string | undefined;
  maxDailyOrders: number | undefined;
  menuItemStatus: MenuItemStatus;
}

export type EditMenuFormAction =
  | { type: "SET_MENU_NAME"; payload: string }
  | { type: "SET_PRICE"; payload: number }
  | { type: "SET_DESCRIPTION"; payload: string }
  | { type: "SET_SUB_CATEGORY"; payload: string }
  | { type: "SET_MAX_DAILY_ORDERS"; payload: number | undefined }
  | { type: "SET_MENU_ITEM_STATUS"; payload: MenuItemStatus };

export type EditMenuFormActionTypes = ActionTypes<EditMenuFormAction>;
export const editMenuFormAcitonTypes: EditMenuFormActionTypes[] = [
  "SET_MENU_NAME",
  "SET_PRICE",
  "SET_DESCRIPTION",
  "SET_SUB_CATEGORY",
  "SET_MAX_DAILY_ORDERS",
  "SET_MENU_ITEM_STATUS",
];

export const initialMenuFormState: EditMenuFormState = {
  menuName: "",
  price: 0,
  description: "",
  subCategory: SUB_CATEGORY_VALUE_NONE,
  maxDailyOrders: undefined,
  menuItemStatus: MenuItemStatus.AVAILABLE,
};

const editMenuFormReducer = (
  state: EditMenuFormState,
  action: EditMenuFormAction
): EditMenuFormState => {
  switch (action.type) {
    case "SET_MENU_NAME":
      return { ...state, menuName: action.payload };
    case "SET_PRICE":
      return { ...state, price: action.payload };
    case "SET_DESCRIPTION":
      return { ...state, description: action.payload };
    case "SET_SUB_CATEGORY":
      return { ...state, subCategory: action.payload };
    case "SET_MAX_DAILY_ORDERS":
      return { ...state, maxDailyOrders: action.payload };
    case "SET_MENU_ITEM_STATUS":
      return { ...state, menuItemStatus: action.payload };
    default:
      return state;
  }
};

export default editMenuFormReducer;
