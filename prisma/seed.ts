import {
  COUNTER_NUMBER_MAX,
  MENU_NUMBER_MAX,
  MONTHLY_DURATION,
  MONTHLY_PRICE,
  PLAN_ID,
  TABLE_NUMBER_MAX,
  TRIAL_COUNTER_NUMBER_MAX,
  TRIAL_DURATION,
  TRIAL_MENU_NUMBER_MAX,
  TRIAL_PRICE,
  TRIAL_TABLE_NUMBER_MAX,
  YEARLY_DURATION,
  YEARLY_PRICE,
} from "@/constants/plan";
import {
  CreateMenuCategoryParams,
  CreateMenuItemParams,
  createMenuCategoryWithSub,
  createMenuItem,
  getAllPlans,
  upsertPlans,
} from "@/database";
import isEmpty from "@/utils/validation/isEmpty";
import { CurrencyType, PlanType, PrismaClient } from "@prisma/client";
const seedPrisma = new PrismaClient();

async function main() {
  const plans = [
    {
      id: PLAN_ID.TRIAL_PLAN,
      planType: PlanType.FREE_TRIAL,
      name: "Try riding YOSHI",
      description: "90-Day Free Trial",
      maxMenus: TRIAL_MENU_NUMBER_MAX,
      maxTables: TRIAL_TABLE_NUMBER_MAX + TRIAL_COUNTER_NUMBER_MAX,
      price: TRIAL_PRICE,
      currency: CurrencyType.USD,
      duration: TRIAL_DURATION,
    },
    {
      id: PLAN_ID.MONTHLY_PLAN,
      planType: PlanType.MONTHLY,
      name: "Have fun with YOSHI every month",
      description: "Monthly Paid",
      maxMenus: MENU_NUMBER_MAX,
      maxTables: TABLE_NUMBER_MAX + COUNTER_NUMBER_MAX,
      price: MONTHLY_PRICE,
      currency: CurrencyType.USD,
      duration: MONTHLY_DURATION,
    },
    {
      id: PLAN_ID.YEARLY_PLAN,
      planType: PlanType.YEARLY,
      name: "YOSHI is your friend every year!",
      description: "1 Year Paid",
      maxMenus: MENU_NUMBER_MAX,
      maxTables: TABLE_NUMBER_MAX + COUNTER_NUMBER_MAX,
      price: YEARLY_PRICE,
      currency: CurrencyType.USD,
      duration: YEARLY_DURATION,
    },
  ];

  const allPlans = await getAllPlans();
  if (isEmpty(allPlans)) {
    const createPlansResult = await upsertPlans(plans);
    // log result
    console.log("Success create plans: ", createPlansResult);
  }

  const menuCategoriesDemo: CreateMenuCategoryParams[] = [
    {
      restaurantId: "yoshi-demo", // !!!: Change this to your restaurant id
      name: "Lunch",
      description: "Delicious lunch meals",
      imageUrl: "/menus/yoshi-demo/_category_Lunch.jpg",
    },
    {
      restaurantId: "yoshi-demo", // !!!: Change this to your restaurant id
      name: "Drink",
      description: "Refreshing drinks",
      imageUrl: "/menus/yoshi-demo/_category_Drink.jpg",
    },
    {
      restaurantId: "yoshi-demo", // !!!: Change this to your restaurant id
      name: "Dessert",
      description: "Sweet desserts",
      imageUrl: "/menus/yoshi-demo/_category_Dessert.jpg",
    },
  ];

  const menuSubCategoriesLunchDemo = [
    {
      name: "Burger",
    },
    {
      name: "Pasta",
    },
  ];

  const menuSubCategoriesDrinkDemo = [
    {
      name: "Coffee",
    },
    {
      name: "Soft Drink",
    },
  ];

  const [lunchCategory, lunchSubCategory] = await createMenuCategoryWithSub(
    menuCategoriesDemo[0],
    menuSubCategoriesLunchDemo
  );
  if (lunchCategory && lunchSubCategory) {
    // log result
    console.log(
      "Success create category and subs: ",
      lunchCategory,
      lunchSubCategory
    );
  }
  const [drinkCategory, drinkSubCategory] = await createMenuCategoryWithSub(
    menuCategoriesDemo[1],
    menuSubCategoriesDrinkDemo
  );
  if (drinkCategory && drinkSubCategory) {
    // log result
    console.log(
      "Success create category and subs: ",
      drinkCategory,
      drinkSubCategory
    );
  }
  const [dessertCategory] = await createMenuCategoryWithSub(
    menuCategoriesDemo[2]
  );
  if (dessertCategory) {
    // log result
    console.log("Success create category: ", dessertCategory);
  }

  const menuItemsDemo: CreateMenuItemParams[] = [
    {
      categoryId: lunchCategory.id,
      subCategoryId: lunchSubCategory && lunchSubCategory[0].id,
      name: "Beef Burger",
      description: "Beef Burger with cheese",
      price: 890,
      imageUrl: "menus/yoshi-demo/Lunch/beef-burger.jpg",
    },
    {
      categoryId: lunchCategory.id,
      subCategoryId: lunchSubCategory && lunchSubCategory[1].id,
      name: "Tomato Pasta",
      description: "Tomato Pasta with cheese",
      price: 1200,
      imageUrl: "menus/yoshi-demo/Lunch/tomato-pasta.jpg",
    },
    {
      categoryId: drinkCategory.id,
      subCategoryId: drinkSubCategory && drinkSubCategory[0].id,
      name: "Coffee Latte",
      description: "Coffee Latte with milk",
      price: 500,
      imageUrl: "menus/yoshi-demo/Drink/coffee-latte.jpg",
    },
    {
      categoryId: drinkCategory.id,
      subCategoryId: drinkSubCategory && drinkSubCategory[1].id,
      name: "Coke",
      description: "Coke with ice",
      price: 350,
      imageUrl: "menus/yoshi-demo/Drink/coke.jpg",
    },
    {
      categoryId: dessertCategory.id,
      name: "Chocolate Cake",
      description: "Chocolate Cake using Belgian chocolate",
      price: 1500,
      imageUrl: "menus/yoshi-demo/Dessert/chocolate-cake.jpg",
    },
  ];

  menuItemsDemo.forEach(async (menuItem: CreateMenuItemParams) => {
    const createMenuItemResult = await createMenuItem(menuItem);
    // log result
    console.log("Success create menu item: ", createMenuItemResult);
  });
}

main()
  .catch((err) => {
    // send error to sentry
    console.log(err);
    process.exit(1);
  })
  .finally(() => seedPrisma.$disconnect());
