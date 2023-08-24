import { IMenuCategory } from "@/database";
import { MenuItem, MenuSubCategory } from "@prisma/client";
import { atom } from "recoil";

export const menuOpenState = atom<boolean>({
  key: "menuOpenState",
  default: false,
});

export const editingState = atom<boolean>({
  key: "editingState",
  default: true,
});

export const mobileState = atom<boolean>({
  key: "mobileState",
  default: false,
});

export const showMenuEditState = atom<boolean>({
  key: "showMenuEditState",
  default: false,
});

export const showCategoryEditState = atom<boolean>({
  key: "showCategoryEditState",
  default: false,
});

export const categoriesState = atom<IMenuCategory[]>({
  key: "categories",
  default: [],
});

export const selectedCategoryState = atom<IMenuCategory | null>({
  key: "selectedCategory",
  default: null,
});

export const selectedSubCategoryState = atom<
  Record<string, MenuSubCategory | null>
>({
  key: "selectedSubCategory",
  default: {},
});

export const menuEditAtom = atom<MenuItem | null>({
  key: "menuEdit",
  default: null,
});
