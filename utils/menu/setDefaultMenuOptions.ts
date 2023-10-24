import { Dispatch } from "react";
import isEmpty from "../validation/isEmpty";
import { MenuItemOptionForm } from "./validateMenuOptions";
import { EditOptionsAction } from "@/reducers/menu/editOptionsReducer";

export default function setDefaultMenuOptions(
  options: MenuItemOptionForm[],
  dispatch: Dispatch<EditOptionsAction>,
  formatOption: (option: MenuItemOptionForm) => MenuItemOptionForm
) {
  if (!isEmpty(options)) {
    const formattedOptions = options.map(formatOption);
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
