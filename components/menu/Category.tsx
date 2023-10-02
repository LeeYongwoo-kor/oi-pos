import { IMenuCategory } from "@/database";
import {
  categoriesState,
  editingState,
  selectedCategoryState,
  selectedEditCategoryState,
  showCategoryEditState,
} from "@/recoil/state/menuState";
import {
  faBurger,
  faCirclePlus,
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MenuCategoryStatus } from "@prisma/client";
import Image from "next/image";
import { useEffect } from "react";
import { useRecoilCallback, useRecoilState, useRecoilValue } from "recoil";

export default function Category() {
  const isEditing = useRecoilValue(editingState);
  const categories = useRecoilValue(categoriesState);
  const [selectedCategory, setSelectedCategory] = useRecoilState(
    selectedCategoryState
  );

  const handleEditCategory = useRecoilCallback(
    ({ set }) =>
      (category: IMenuCategory | null) => {
        if (!isEditing) {
          return;
        }
        set(selectedEditCategoryState, category);
        set(showCategoryEditState, true);
      },
    [isEditing]
  );

  useEffect(() => {
    const updatedSelectedCategory = categories.find(
      (category) => category.id === selectedCategory?.id
    );
    if (updatedSelectedCategory) {
      setSelectedCategory(updatedSelectedCategory);
    } else {
      setSelectedCategory(categories[0] || null);
    }
  }, [categories]);

  return (
    <div className="flex space-x-2 overflow-x-scroll scrollbar-hide">
      {categories.map((category) => {
        const clickHandlerProps = !isEditing
          ? {
              onClick: () => {
                if (category.status === MenuCategoryStatus.SOLD_OUT) {
                  return;
                }
                setSelectedCategory(category);
              },
            }
          : {};

        return (
          <div
            key={category.id}
            {...clickHandlerProps}
            className={`flex flex-col items-center justify-center space-y-2   ${
              !isEditing && category.status === MenuCategoryStatus.SOLD_OUT
                ? "text-gray-400"
                : "hover:text-red-500 cursor-pointer"
            }`}
          >
            <div
              className={`relative hover:opacity-100 flex flex-col items-center w-48 h-24 ${
                isEditing ? "cursor-pointer hover-wrapper" : ""
              } ${
                category.id === selectedCategory?.id
                  ? "opacity-100"
                  : category.status !== MenuCategoryStatus.SOLD_OUT
                  ? "opacity-70"
                  : ""
              }`}
            >
              {category.status === MenuCategoryStatus.SOLD_OUT && (
                <div className="absolute z-10 text-lg italic font-bold transform -translate-x-1/2 -translate-y-1/2 text-slate-800 top-1/2 left-1/2">
                  SOLD OUT
                </div>
              )}
              {isEditing && (
                <div className="hidden edit-icon">
                  <button
                    onClick={() => handleEditCategory(category)}
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
                <div
                  onClick={() => handleEditCategory(category)}
                  className="overlay"
                />
              )}
              {category.imageUrl ? (
                <Image
                  src={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${
                    category.imageUrl || ""
                  }?v=${category.imageVersion || 0}`}
                  alt={category.name}
                  fill
                  className={`object-cover w-full ${
                    category.status === MenuCategoryStatus.SOLD_OUT
                      ? "grayscale opacity-30"
                      : ""
                  }`}
                  draggable={false}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-slate-200">
                  <FontAwesomeIcon icon={faBurger} size="3x" />
                </div>
              )}
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (
                  !isEditing &&
                  category.status === MenuCategoryStatus.SOLD_OUT
                ) {
                  return;
                }
                setSelectedCategory(category);
              }}
              className="flex items-center justify-center w-full"
            >
              <div
                className={`text-base font-semibold ${
                  category.id === selectedCategory?.id
                    ? "text-red-500 font-bold"
                    : ""
                }`}
              >
                {category.name}
              </div>
            </div>
            <hr
              className={`h-1 mt-1 transform origin-left transition-all duration-300 ${
                category.id === selectedCategory?.id ? "w-44 bg-red-500" : "w-0"
              }`}
            />
          </div>
        );
      })}
      {isEditing && (
        <button
          onClick={() => handleEditCategory(null)}
          className="flex flex-col items-center justify-center w-48 p-4 mb-2 space-y-2 border-4 border-dotted hover:text-zinc-500 text-zinc-400 border-zinc-300 hover:border-zinc-500"
        >
          <FontAwesomeIcon size="2x" icon={faCirclePlus} />
          <span className="text-base font-semibold">Add new category</span>
        </button>
      )}
    </div>
  );
}
