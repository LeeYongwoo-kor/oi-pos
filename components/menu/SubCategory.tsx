import { useConfirm } from "@/hooks/useConfirm";
import { subCategoriesSelector } from "@/recoil/selector/menuSelector";
import {
  editingState,
  selectedCategoryState,
  selectedSubCategoryState,
} from "@/recoil/state/menuState";
import { faPen, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MenuSubCategory } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";

export default function SubCategory() {
  const isEditing = useRecoilValue(editingState);
  const selectedCategory = useRecoilValue(selectedCategoryState);
  const subCategories = useRecoilValue(subCategoriesSelector);
  const [selectedSubCategories, setSelectedSubCategories] = useRecoilState(
    selectedSubCategoryState
  );
  const { showConfirm } = useConfirm();
  const inputEditRef = useRef<HTMLInputElement>(null);
  const inputAddRef = useRef<HTMLInputElement>(null);
  const [editingSubCategoryId, setEditingSubCategoryId] = useState<
    string | null
  >(null);
  const [isClickedAddSubCategory, setIsClickedAddSubCategory] = useState(false);

  const selectedSubCategory = selectedCategory
    ? selectedSubCategories[selectedCategory.id]
    : null;

  const handleClickEditSubCategory = (subCategoryId: string) => {
    setEditingSubCategoryId(subCategoryId);
  };

  const handleClickDeleteSubCategory = (subCategoryId: string) => {
    showConfirm({
      title: "Delete Sub Category",
      message: "Are you sure you want to delete this sub category?",
      onConfirm: () => handleDeleteSubCategory(subCategoryId),
      confirmText: "Delete",
      cancelText: "Cancel",
    });
  };

  const handleEditSubCategory = (subCategoryId: string, newName: string) => {
    // Logic to update the subcategory name in your data source
    // ...
    console.log("subCategoryId", subCategoryId);
    console.log("newName", newName);

    // Exit editing mode
    setEditingSubCategoryId(null);
  };

  const handleDeleteSubCategory = (subCategoryId: string) => {
    if (selectedSubCategory?.id === subCategoryId) {
      handleSubCategoryClick(null);
    }
  };

  const handleAddSubCategory = (newSubcategory: string) => {
    console.log(newSubcategory);
    setIsClickedAddSubCategory(false);
  };

  const handleSubCategoryClick = (subCategory: MenuSubCategory | null) => {
    if (selectedCategory) {
      setSelectedSubCategories((prev) => {
        if (subCategory === null) {
          return Object.keys(prev).reduce((acc, key) => {
            if (key !== selectedCategory.id) {
              acc[key] = prev[key];
            }
            return acc;
          }, {} as typeof prev);
        }

        return {
          ...prev,
          [selectedCategory.id]: subCategory,
        };
      });
    }
  };

  useEffect(() => {
    if (editingSubCategoryId) {
      inputEditRef.current?.focus();
    }
  }, [editingSubCategoryId]);

  useEffect(() => {
    if (isClickedAddSubCategory) {
      inputAddRef.current?.focus();
    }
  }, [isClickedAddSubCategory]);

  return (
    <div className="flex px-1 py-2 mb-1 space-x-1.5 bg-slate-200 rounded-3xl">
      <span
        className={`p-2 text-xs tracking-wider hover:bg-red-600 text-white ${
          !selectedSubCategory ? "bg-red-500" : "bg-gray-400"
        } max-w-prose rounded-3xl cursor-pointer`}
        onClick={() => handleSubCategoryClick(null)}
      >
        All
      </span>
      {subCategories.map((subCategory) => (
        <div
          key={subCategory.id}
          className={`p-2 text-xs tracking-wider hover:bg-red-600 text-white ${
            subCategory.id === selectedSubCategory?.id
              ? "bg-red-500"
              : "bg-gray-400"
          } max-w-prose rounded-3xl cursor-pointer`}
          onClick={() => handleSubCategoryClick(subCategory)}
        >
          {editingSubCategoryId === subCategory.id ? (
            <input
              ref={inputEditRef}
              className="w-16 tracking-wider text-white bg-transparent max-w-prose"
              type="text"
              defaultValue={subCategory.name || ""}
              onBlur={(e) =>
                handleEditSubCategory(subCategory.id, e.target.value)
              }
            />
          ) : (
            <span>{subCategory.name}</span>
          )}
          {isEditing && (
            <>
              <button
                onClick={() => handleClickEditSubCategory(subCategory.id)}
                className="ml-1.5 text-gray-200 hover:text-amber-400"
              >
                <FontAwesomeIcon size="1x" icon={faPen} />
              </button>
              <button
                onClick={() => handleClickDeleteSubCategory(subCategory.id)}
                className="ml-1.5 text-gray-200 hover:text-red-800"
              >
                <FontAwesomeIcon size="1x" icon={faTrash} />
              </button>
            </>
          )}
        </div>
      ))}
      {isEditing && (
        <span
          className="p-2 text-xs tracking-wider text-white cursor-pointer hover:bg-zinc-500 bg-zinc-400 rounded-3xl"
          onClick={() => setIsClickedAddSubCategory(true)}
        >
          {isClickedAddSubCategory ? (
            <input
              ref={inputAddRef}
              className="w-16 tracking-wider text-white bg-transparent max-w-prose"
              type="text"
              onBlur={(e) => handleAddSubCategory(e.target.value)}
            />
          ) : (
            <FontAwesomeIcon className="text-white" size="lg" icon={faPlus} />
          )}
        </span>
      )}
    </div>
  );
}
