import { CreateMenuCategoryParams, CreateMenuItemParams } from "@/database";

export interface IMenuCategoryDemo {
  lunchCategoryId: string;
  burgerSubCategoryId: string;
  pastaSubCategoryId: string;
  drinkCategoryId: string;
  coffeeSubCategoryId: string;
  softDrinkSubCategoryId: string;
  dessertCategoryId: string;
}

export const menuCategoriesDemo = (
  restaurantId: string
): CreateMenuCategoryParams[] => {
  return [
    {
      restaurantId,
      name: "Lunch",
      description: "Delicious lunch meals",
      imageUrl: `menus/${restaurantId}/_category_Lunch.jpg`,
    },
    {
      restaurantId,
      name: "Drink",
      description: "Refreshing drinks",
      imageUrl: `menus/${restaurantId}/_category_Drink.jpg`,
    },
    {
      restaurantId,
      name: "Dessert",
      description: "Sweet desserts",
      imageUrl: `menus/${restaurantId}/_category_Dessert.jpg`,
    },
  ];
};

export const menuSubCategoriesLunchDemo = [
  {
    name: "Burger",
  },
  {
    name: "Pasta",
  },
];

export const menuSubCategoriesDrinkDemo = [
  {
    name: "Coffee",
  },
  {
    name: "Soft Drink",
  },
];

export const menuItemsDemo = (
  restaurantId: string,
  demoData: IMenuCategoryDemo
): CreateMenuItemParams[] => {
  const {
    lunchCategoryId,
    burgerSubCategoryId,
    pastaSubCategoryId,
    drinkCategoryId,
    coffeeSubCategoryId,
    softDrinkSubCategoryId,
    dessertCategoryId,
  } = demoData;
  return [
    {
      categoryId: lunchCategoryId,
      subCategoryId: burgerSubCategoryId,
      name: "Beef Burger",
      description: "Beef Burger with cheese",
      price: 890,
      imageUrl: `menus/${restaurantId}/Lunch/beef-burger.jpg`,
    },
    {
      categoryId: lunchCategoryId,
      subCategoryId: pastaSubCategoryId,
      name: "Tomato Pasta",
      description: "Tomato Pasta with cheese",
      price: 1200,
      imageUrl: `menus/${restaurantId}/Lunch/tomato-pasta.jpg`,
    },
    {
      categoryId: drinkCategoryId,
      subCategoryId: coffeeSubCategoryId,
      name: "Coffee Latte",
      description: "Coffee Latte with milk",
      price: 500,
      imageUrl: `menus/${restaurantId}/Drink/coffee-latte.jpg`,
    },
    {
      categoryId: drinkCategoryId,
      subCategoryId: softDrinkSubCategoryId,
      name: "Coke",
      description: "Coke with ice",
      price: 350,
      imageUrl: `menus/${restaurantId}/Drink/coke.jpg`,
    },
    {
      categoryId: dessertCategoryId,
      name: "Chocolate Cake",
      description: "Chocolate Cake using Belgian chocolate",
      price: 1500,
      imageUrl: `menus/${restaurantId}/Dessert/chocolate-cake.jpg`,
    },
  ];
};
