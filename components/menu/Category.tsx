import Image from "next/image";
import { useState } from "react";

export default function Category() {
  const categories = [
    {
      id: "1",
      name: "Lunch",
      image: "/menus/yoshi-demo/_category_Lunch.jpg",
    },
    {
      id: "2",
      name: "Drink",
      image: "/menus/yoshi-demo/_category_Drink.jpg",
    },
    {
      id: "3",
      name: "Dessert",
      image: "/menus/yoshi-demo/_category_Dessert.jpg",
    },
    {
      id: "4",
      name: "Lunch",
      image: "/menus/yoshi-demo/_category_Lunch.jpg",
    },
    {
      id: "5",
      name: "Drink",
      image: "/menus/yoshi-demo/_category_Drink.jpg",
    },
    {
      id: "6",
      name: "Dessert",
      image: "/menus/yoshi-demo/_category_Dessert.jpg",
    },
  ];
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id);
  return (
    <div className="flex space-x-2 overflow-x-scroll scrollbar-hide">
      {categories.map((category) => (
        <div
          key={category.id}
          onClick={() => setSelectedCategory(category.id)}
          className="flex flex-col items-center justify-center space-y-2 cursor-pointer hover:text-red-500"
        >
          <button className="relative flex flex-col items-center w-48 h-24">
            <Image
              src={`https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_DOMAIN}${category.image}`}
              alt={category.name}
              fill
              className="object-cover w-full"
              draggable={false}
            />
          </button>
          <div
            className={`relative text-base font-semibold ${
              selectedCategory === category.id ? "text-red-500 font-bold" : ""
            }`}
          >
            {category.name}
          </div>
          <hr
            className={`h-1 mt-1 transform origin-left transition-all duration-300 ${
              selectedCategory === category.id ? "w-44 bg-red-500" : "w-0"
            }`}
          />
        </div>
      ))}
    </div>
  );
}
