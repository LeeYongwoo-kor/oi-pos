import { MenuCategoryStatus } from "@prisma/client";

export interface EditCategoryFormState {
  categoryName: string;
  description: string;
  menuCategoryStatus: MenuCategoryStatus;
}

export type EditCategoryFormAction =
  | { type: "SET_CATEGORY_NAME"; payload: string }
  | { type: "SET_DESCRIPTION"; payload: string }
  | { type: "SET_MENU_CATEGORY_STATUS"; payload: MenuCategoryStatus };

export type EditCategoryFormActionTypes = ActionTypes<EditCategoryFormAction>;
export const editCategoryFormAcitonTypes: EditCategoryFormActionTypes[] = [
  "SET_CATEGORY_NAME",
  "SET_DESCRIPTION",
  "SET_MENU_CATEGORY_STATUS",
];

export const initialCategoryFormState: EditCategoryFormState = {
  categoryName: "",
  description: "",
  menuCategoryStatus: MenuCategoryStatus.AVAILABLE,
};

const editCategoryFormReducer = (
  state: EditCategoryFormState,
  action: EditCategoryFormAction
): EditCategoryFormState => {
  switch (action.type) {
    case "SET_CATEGORY_NAME":
      return { ...state, categoryName: action.payload };
    case "SET_DESCRIPTION":
      return { ...state, description: action.payload };
    case "SET_MENU_CATEGORY_STATUS":
      return { ...state, menuCategoryStatus: action.payload };
    default:
      return state;
  }
};

export default editCategoryFormReducer;
