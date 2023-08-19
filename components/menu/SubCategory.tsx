import { useState } from "react";

export default function SubCategory() {
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(1);
  const subCategories = [
    {
      id: 1,
      name: "All",
    },
    {
      id: 2,
      name: "Hamburger",
    },
    {
      id: 3,
      name: "Pasta",
    },
  ];
  return (
    <div className="flex px-1 py-2 mb-1 space-x-1.5 bg-slate-200 rounded-3xl">
      {subCategories.map((subCategory) => (
        <span
          key={subCategory.id}
          className={`p-2 text-xs tracking-wider hover:bg-red-600 text-white ${
            subCategory.id === selectedSubCategoryId
              ? "bg-red-500"
              : "bg-gray-400"
          } max-w-prose rounded-3xl cursor-pointer`}
          onClick={() => setSelectedSubCategoryId(subCategory.id)}
        >
          {subCategory.name}
        </span>
      ))}
    </div>
  );
}
