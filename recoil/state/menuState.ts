import { IMenuCategory, IMenuItem } from "@/database";
import { MenuSubCategory } from "@prisma/client";
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

export const showMenuDetailState = atom<boolean>({
  key: "showMenuDetailState",
  default: false,
});

export const categoriesState = atom<IMenuCategory[]>({
  key: "categories",
  default: [],
});

export const selectedEditCategoryState = atom<IMenuCategory | null>({
  key: "selectedEditCategory",
  default: null,
});

export const selectedCategoryState = atom<IMenuCategory | null>({
  key: "selectedCategory",
  default: null,
});

export const selectedEditMenuState = atom<IMenuItem | null>({
  key: "selectedEditMenu",
  default: null,
});

export const selectedMenuState = atom<IMenuItem | null>({
  key: "selectedMenu",
  default: null,
});

export const selectedSubCategoryState = atom<
  Record<string, MenuSubCategory | null>
>({
  key: "selectedSubCategory",
  default: {},
});
