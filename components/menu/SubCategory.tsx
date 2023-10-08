import { OWNER_ENDPOINT, RESTAURANT_MENU_ENDPOINT } from "@/constants/endpoint";
import { Method } from "@/constants/fetch";
import { IMenuCategory } from "@/database";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import useMutation from "@/lib/client/useMutation";
import {
  IDeleteMenuSubCategoryBody,
  IPatchMenuSubCategoryBody,
  IPostMenuSubCategoryBody,
} from "@/pages/api/v1/owner/restaurants/[restaurantId]/menus/sub-categories";
import { subCategoriesSelector } from "@/recoil/selector/menuSelector";
import {
  editingState,
  selectedCategoryState,
  selectedSubCategoryState,
} from "@/recoil/state/menuState";
import { faPen, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MenuSubCategory } from "@prisma/client";
import cuid from "cuid";
import { useEffect, useRef, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";

type SubCategoryProps = {
  restaurantId: string | undefined;
  categoryInfo: IMenuCategory[] | undefined;
};

export default function SubCategory({
  restaurantId,
  categoryInfo,
}: SubCategoryProps) {
  const [createSubCategory, { error: createSubCategoryErr }] = useMutation<
    MenuSubCategory,
    IPostMenuSubCategoryBody
  >(
    restaurantId
      ? OWNER_ENDPOINT.RESTAURANT.MENU.SUB_CATEGORY(restaurantId)
      : null,
    Method.POST
  );
  const [updateSubCategory, { error: updateSubCategoryErr }] = useMutation<
    MenuSubCategory,
    IPatchMenuSubCategoryBody
  >(
    restaurantId
      ? OWNER_ENDPOINT.RESTAURANT.MENU.SUB_CATEGORY(restaurantId)
      : null,
    Method.PATCH
  );
  const [deleteSubCategory, { error: deleteSubCategoryErr }] = useMutation<
    MenuSubCategory,
    IDeleteMenuSubCategoryBody
  >(
    restaurantId
      ? OWNER_ENDPOINT.RESTAURANT.MENU.SUB_CATEGORY(restaurantId)
      : null,
    Method.DELETE
  );

  const isEditing = useRecoilValue(editingState);
  const selectedCategory = useRecoilValue(selectedCategoryState);
  const subCategories = useRecoilValue(subCategoriesSelector);
  const [selectedSubCategories, setSelectedSubCategories] = useRecoilState(
    selectedSubCategoryState
  );
  const { showConfirm } = useConfirm();
  const { addToast } = useToast();
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
      buttonType: "fatal",
      onConfirm: () => handleDeleteSubCategory(subCategoryId),
      confirmText: "Delete",
      cancelText: "Cancel",
    });
  };

  const handleKeyDownFromAddInput = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      handleAddSubCategory(event.currentTarget.value);
    }
  };

  const handleKeyDownFromEditInput = (
    subCategoryId: string,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      handleEditSubCategory(subCategoryId, event.currentTarget.value);
    }
  };

  const handleEditSubCategory = async (
    subCategoryId: string,
    newName: string
  ) => {
    if (
      !selectedCategory ||
      !subCategoryId ||
      !categoryInfo ||
      !newName ||
      newName === selectedSubCategory?.name
    ) {
      setEditingSubCategoryId(null);
      return;
    }

    const params: IPatchMenuSubCategoryBody = {
      menuSubCategoryId: subCategoryId,
      name: newName,
    };

    const updateCategories = categoryInfo.map((category) => {
      if (category.id === selectedCategory.id) {
        return {
          ...category,
          subCategories: category.subCategories.map((subCategory) => {
            if (subCategory.id === subCategoryId) {
              return { ...subCategory, name: newName };
            }
            return subCategory;
          }),
        };
      }
      return category;
    });

    // Reset the editing state
    setEditingSubCategoryId(null);

    await updateSubCategory(params, {
      isMutate: false,
      isRevalidate: false,
      optimisticData: updateCategories,
      additionalKeys: [
        RESTAURANT_MENU_ENDPOINT.CATEGORY(selectedCategory.restaurantId),
      ],
    });
  };

  const handleDeleteSubCategory = async (subCategoryId: string) => {
    if (!selectedCategory || !subCategoryId || !categoryInfo) {
      return;
    }

    const params: IDeleteMenuSubCategoryBody = {
      menuSubCategoryId: subCategoryId,
    };

    const updateCategories = categoryInfo.map((category) => {
      if (category.id === selectedCategory.id) {
        return {
          ...category,
          subCategories: category.subCategories.filter(
            (subCategory) => subCategory.id !== subCategoryId
          ),
        };
      }
      return category;
    });

    // Reset the selectedCubCategories state
    if (selectedCategory) {
      const { [selectedCategory.id]: _, ...rest } = selectedSubCategories;
      setSelectedSubCategories(rest);
    }

    await deleteSubCategory(params, {
      isMutate: false,
      isRevalidate: false,
      optimisticData: updateCategories,
      additionalKeys: [
        RESTAURANT_MENU_ENDPOINT.CATEGORY(selectedCategory.restaurantId),
      ],
    });
  };

  const handleAddSubCategory = async (newName: string) => {
    if (!selectedCategory || !newName || !categoryInfo) {
      setIsClickedAddSubCategory(false);
      return;
    }

    const params: IPostMenuSubCategoryBody = {
      id: cuid(),
      categoryId: selectedCategory.id,
      name: newName,
    };

    const newCategories = categoryInfo.map((category) => {
      if (category.id === selectedCategory.id) {
        return {
          ...category,
          subCategories: [...category.subCategories, params],
        };
      }
      return category;
    });

    // Reset the cliked state
    setIsClickedAddSubCategory(false);

    await createSubCategory(params, {
      isMutate: false,
      isRevalidate: false,
      optimisticData: newCategories,
      additionalKeys: [
        RESTAURANT_MENU_ENDPOINT.CATEGORY(selectedCategory.restaurantId),
      ],
    });
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

  useEffect(() => {
    if (createSubCategoryErr) {
      addToast("error", createSubCategoryErr.message);
    }
  }, [createSubCategoryErr]);

  useEffect(() => {
    if (updateSubCategoryErr) {
      addToast("error", updateSubCategoryErr.message);
    }
  }, [updateSubCategoryErr]);

  useEffect(() => {
    if (deleteSubCategoryErr) {
      addToast("error", deleteSubCategoryErr.message);
    }
  }, [deleteSubCategoryErr]);

  return (
    <div className="flex overflow-x-scroll scrollbar-hide px-1 py-2 mb-1 space-x-1.5 bg-slate-200 rounded-3xl">
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
              onKeyDown={(e) => handleKeyDownFromEditInput(subCategory.id, e)}
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
              onKeyDown={handleKeyDownFromAddInput}
            />
          ) : (
            <FontAwesomeIcon className="text-white" size="lg" icon={faPlus} />
          )}
        </span>
      )}
    </div>
  );
}
