import isPositiveInteger from "../validation/isPositiveInteger";

export interface MenuOptionForm {
  id?: string;
  name: string;
  price: number | "";
  error?: string;
}
export interface MenuItemOptionForm extends MenuOptionForm {
  categoryOptionId?: string;
}

export const initialMenuOptions: MenuOptionForm = { name: "", price: "" };

export default function validateMenuOptions(
  options: MenuOptionForm[]
): MenuOptionForm[] {
  return options.map((option) => {
    const { name, price } = option;
    if (name.length <= 0) {
      return { ...option, error: "※ Name is required" };
    }
    if (!price) {
      return { ...option, error: "※ Price is required" };
    }

    if (!isPositiveInteger(Number(price))) {
      return { ...option, error: "※ Price must be a positive Integer" };
    }

    const { error: _, ...restOption } = option;
    return { ...restOption, price: Number(price) };
  });
}
