import { MenuItemOptionForm } from "@/utils/menu/validateMenuOptions";

export interface EditOptionsState {
  options: MenuItemOptionForm[];
  optionCount: number;
  previousOptions: MenuItemOptionForm[];
}

export type EditOptionsAction =
  | { type: "SET_OPTIONS"; payload: MenuItemOptionForm[] }
  | { type: "ADD_OPTIONS"; payload: MenuItemOptionForm[] }
  | { type: "SUBTRACT_OPTIONS" }
  | { type: "HANDLE_REMOVE_OPTION"; payload: MenuItemOptionForm[] }
  | {
      type: "SET_DEFAULT_OPTIONS";
      payload: {
        options: MenuItemOptionForm[];
        optionCount: number;
        previousOptions: MenuItemOptionForm[];
      };
    };

export type EditOptionsActionTypes = ActionTypes<EditOptionsAction>;
export const editOptionsActionTypes: EditOptionsActionTypes[] = [
  "ADD_OPTIONS",
  "HANDLE_REMOVE_OPTION",
  "SET_DEFAULT_OPTIONS",
  "SET_OPTIONS",
  "SUBTRACT_OPTIONS",
];

export const initialOptionsState: EditOptionsState = {
  options: [],
  optionCount: 0,
  previousOptions: [],
};

const editOptionsReducer = (
  state: EditOptionsState,
  action: EditOptionsAction
): EditOptionsState => {
  switch (action.type) {
    case "SET_OPTIONS": {
      return { ...state, options: action.payload };
    }
    case "ADD_OPTIONS": {
      if (state.optionCount >= 10) {
        return { ...state, optionCount: state.optionCount + 1 };
      }
      return {
        ...state,
        options: action.payload,
        optionCount: state.optionCount + 1,
      };
    }
    case "SUBTRACT_OPTIONS": {
      if (state.optionCount <= 0) {
        return state;
      }
      return { ...state, optionCount: state.optionCount - 1 };
    }
    case "HANDLE_REMOVE_OPTION":
      return {
        ...state,
        options: action.payload,
        optionCount: state.optionCount - 1,
      };
    case "SET_DEFAULT_OPTIONS": {
      const { options, optionCount, previousOptions } = action.payload;
      return { ...state, options, optionCount, previousOptions };
    }
    default:
      return state;
  }
};

export default editOptionsReducer;
