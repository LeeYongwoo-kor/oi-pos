import { Dispatch } from "react";
import isEmpty from "../validation/isEmpty";
import { MenuItemOptionForm } from "./validateMenuOptions";
import { EditOptionsAction } from "@/reducers/menu/editOptionsReducer";

export default function setDefaultMenuOptions(
  options: Array<MenuItemOptionForm>,
  dispatch: Dispatch<EditOptionsAction>
) {
  if (!isEmpty(options)) {
    const formattedOptions = options.map(({ id, name, price }) => ({
      id,
      name,
      price,
    }));
    dispatch({
      type: "SET_DEFAULT_OPTIONS",
      payload: {
        options: formattedOptions,
        optionCount: formattedOptions.length,
        previousOptions: formattedOptions,
      },
    });
  }
}
