import { IMenuItem } from "@/database";
import isEmpty from "@/utils/validation/isEmpty";
import { MenuSubCategory } from "@prisma/client";
import { selector } from "recoil";
import {
  categoriesState,
  selectedCategoryState,
  selectedSubCategoryState,
} from "../state/menuState";

export const subCategoriesSelector = selector<MenuSubCategory[]>({
  key: "subCategories",
  get: ({ get }) => {
    const categories = get(categoriesState);
    const selectedCategory = get(selectedCategoryState);
    const currentCategory = categories.find(
      (category) => category.id === selectedCategory?.id
    );
    return currentCategory ? currentCategory.subCategories : [];
  },
});

export const menuItemsSelector = selector<IMenuItem[]>({
  key: "menuItems",
  get: ({ get }) => {
    const categories = get(categoriesState);
    const selectedCategory = get(selectedCategoryState);
    const selectedSubCategory = get(selectedSubCategoryState);

    const currentCategory = categories.find(
      (category) => category.id === selectedCategory?.id
    );
    if (!currentCategory) return [];

    if (!isEmpty(selectedSubCategory)) {
      if (!selectedSubCategory[currentCategory.id]) {
        return currentCategory.menuItems;
      }

      return currentCategory.menuItems.filter(
        (item) =>
          item.subCategoryId === selectedSubCategory[currentCategory.id]?.id
      );
    }

    return currentCategory.menuItems;
  },
});
