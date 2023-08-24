import {
  categoriesState,
  editingState,
  selectedCategoryState,
  showCategoryEditState,
} from "@/recoil/state/menuState";
import { faCirclePlus, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useEffect } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";

export default function Category() {
  const isEditing = useRecoilValue(editingState);
  const showEditCategory = useSetRecoilState(showCategoryEditState);
  const categories = useRecoilValue(categoriesState);
  const [selectedCategory, setSelectedCategory] = useRecoilState(
    selectedCategoryState
  );

  const handleEditCategory = () => {
    if (!isEditing) {
      return;
    }
    showEditCategory(true);
  };

  useEffect(() => {
    if (categories && categories.length > 0) {
      setSelectedCategory(categories[0]);
    }
  }, [categories]);

  return (
    <div className="flex space-x-2 overflow-x-scroll scrollbar-hide">
      {categories.map((category) => (
        <div
          key={category.id}
          onClick={() => setSelectedCategory(category)}
          className="flex flex-col items-center justify-center space-y-2 cursor-pointer hover:text-red-500"
        >
          <div
            className={`relative hover:opacity-100 flex flex-col items-center w-48 h-24 ${
              isEditing ? "cursor-pointer hover-wrapper" : ""
            } ${
              category.id === selectedCategory?.id
                ? "opacity-100"
                : "opacity-70"
            }`}
          >
            {isEditing && (
              <div className="hidden edit-icon">
                <button
                  onClick={handleEditCategory}
                  className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
                >
                  <FontAwesomeIcon
                    className="text-white"
                    size="xl"
                    icon={faPenToSquare}
                  />
                </button>
              </div>
            )}
            {isEditing && (
              <div onClick={handleEditCategory} className="overlay" />
            )}
            <Image
              src={`https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_DOMAIN}${
                category.imageUrl || ""
              }?v=${category.imageVersion || 0}`}
              alt={category.name}
              fill
              className="object-cover w-full"
              draggable={false}
            />
          </div>
          <div
            className={`relative text-base font-semibold ${
              category.id === selectedCategory?.id
                ? "text-red-500 font-bold"
                : ""
            }`}
          >
            {category.name}
          </div>
          <hr
            className={`h-1 mt-1 transform origin-left transition-all duration-300 ${
              category.id === selectedCategory?.id ? "w-44 bg-red-500" : "w-0"
            }`}
          />
        </div>
      ))}
      {isEditing && (
        <button
          onClick={handleEditCategory}
          className="flex flex-col items-center justify-center w-48 h-32 p-4 m-1 space-y-2 border-4 border-dotted hover:text-zinc-500 text-zinc-400 border-zinc-300 hover:border-zinc-500"
        >
          <FontAwesomeIcon size="2x" icon={faCirclePlus} />
          <span className="text-base font-semibold">Add new category</span>
        </button>
      )}
    </div>
  );
}
