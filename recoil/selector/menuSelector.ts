import { MenuItem, MenuSubCategory } from "@prisma/client";
import { selector } from "recoil";
import {
  selectedCategoryState,
  selectedSubCategoryState,
} from "../state/menuState";
import isEmpty from "@/utils/validation/isEmpty";

export const subCategoriesSelector = selector<MenuSubCategory[]>({
  key: "subCategories",
  get: ({ get }) => {
    const selectedCategory = get(selectedCategoryState);
    return selectedCategory ? selectedCategory.subCategories : [];
  },
});

export const menuItemsSelector = selector<MenuItem[]>({
  key: "menuItems",
  get: ({ get }) => {
    const selectedCategory = get(selectedCategoryState);
    const selectedSubCategory = get(selectedSubCategoryState);
    if (!selectedCategory) return [];

    if (!isEmpty(selectedSubCategory)) {
      if (!selectedSubCategory[selectedCategory.id]) {
        return selectedCategory.menuItems;
      }

      return selectedCategory.menuItems.filter(
        (item) =>
          item.subCategoryId === selectedSubCategory[selectedCategory.id]?.id
      );
    }

    return selectedCategory.menuItems;
  },
});
