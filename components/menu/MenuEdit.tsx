/* eslint-disable @next/next/no-img-element */
import {
  OPEN_AI_IMAGE_ENDPOINT,
  RESTAURANT_ENDPOINT,
} from "@/constants/endpoint";
import { Method } from "@/constants/fetch";
import { SUB_CATEGORY_VALUE_NONE } from "@/constants/menu";
import { CONFIRM_DIALOG_MESSAGE } from "@/constants/message/confirm";
import { AWS_S3_YOSHI_BUCKET } from "@/constants/service";
import { CreateMenuItemParams, UpdateMenuItemParams } from "@/database";
import useLoading from "@/hooks/context/useLoading";
import { useConfirm } from "@/hooks/useConfirm";
import useDeepEffect from "@/hooks/useDeepEffect";
import { useToast } from "@/hooks/useToast";
import useMutation from "@/lib/client/useMutation";
import { ApiError } from "@/lib/shared/error/ApiError";
import {
  IPostOpenAiImageBody,
  IPostOpenAiImageResponse,
} from "@/pages/api/v1/open-ai-images";
import {
  IDeleteMenuItemBody,
  IPatchMenuItemBody,
  IPostMenuItemBody,
} from "@/pages/api/v1/restaurants/[restaurantId]/menu-items";
import {
  mobileState,
  selectedCategoryState,
  selectedEditMenuState,
  selectedSubCategoryState,
  showMenuEditState,
} from "@/recoil/state/menuState";
import menuItemEditReducer, {
  initialEditMenuState,
} from "@/reducers/menu/menuItemEditReducer";
import getS3UploadParams from "@/utils/menu/getS3UploadParams";
import setDefaultMenuOptions from "@/utils/menu/setDefaultMenuOptions";
import validateMenuOptions, {
  MenuItemOptionForm,
} from "@/utils/menu/validateMenuOptions";
import isArrayOfObjectsChanged from "@/utils/validation/isArrayOfObjectsChanged";
import isEmpty from "@/utils/validation/isEmpty";
import isFormChanged from "@/utils/validation/isFormChanged";
import {
  DeleteObjectCommandInput,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { MenuItem, MenuItemStatus } from "@prisma/client";
import { useEffect, useReducer, useRef } from "react";
import "react-image-crop/dist/ReactCrop.css";
import { useRecoilState, useRecoilValue } from "recoil";
import LoadingOverlay from "../LoadingOverlay";
import ImageEdit from "./ImageEdit";
import OptionsEdit from "./OptionsEdit";

type MenuCategoryEditProps = {
  restaurantId: string | undefined | null;
};

export default function MenuEdit({ restaurantId }: MenuCategoryEditProps) {
  const [
    createMenuItem,
    { error: createMenuItemErr, loading: createMenuItemLoading },
  ] = useMutation<MenuItem, IPostMenuItemBody>(
    restaurantId ? RESTAURANT_ENDPOINT.MENU_ITEM(restaurantId) : null,
    Method.POST
  );
  const [
    updateMenuItem,
    { error: updateMenuItemErr, loading: updateMenuItemLoading },
  ] = useMutation<MenuItem, IPatchMenuItemBody>(
    restaurantId ? RESTAURANT_ENDPOINT.MENU_ITEM(restaurantId) : null,
    Method.PATCH
  );
  const [
    deleteMenuItem,
    { error: deleteMenuItemErr, loading: deleteMenuItemLoading },
  ] = useMutation<MenuItem, IDeleteMenuItemBody>(
    restaurantId ? RESTAURANT_ENDPOINT.MENU_ITEM(restaurantId) : null,
    Method.DELETE
  );
  const [
    createAiImage,
    { error: createAiImageErr, loading: createAiImageLoading },
  ] = useMutation<IPostOpenAiImageResponse, IPostOpenAiImageBody>(
    OPEN_AI_IMAGE_ENDPOINT.BASE,
    Method.POST
  );
  const [isVisible, openEditMenu] = useRecoilState(showMenuEditState);
  const isMobile = useRecoilValue(mobileState);
  const selectedCategory = useRecoilValue(selectedCategoryState);
  const [selectedEditMenu, setSelectedEditMenu] = useRecoilState(
    selectedEditMenuState
  );
  const selectedSubCategories = useRecoilValue(selectedSubCategoryState);
  const { addToast } = useToast();
  const { showConfirm } = useConfirm();
  const withLoading = useLoading();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const [
    {
      selectedFile,
      previewUrl,
      crop,
      menuName,
      price,
      description,
      isAiImageLoading,
      croppedImage,
      renderedDimension,
      shouldProcessCrop,
      activeTab,
      options,
      menuItemStatus,
      optionCount,
      previousOptions,
      subCategory,
      maxDailyOrders,
    },
    dispatch,
  ] = useReducer(menuItemEditReducer, initialEditMenuState);

  const selectedSubCategory = selectedCategory
    ? selectedSubCategories[selectedCategory.id]
    : null;

  const isDisabled =
    menuName.length <= 0 ||
    price <= 0 ||
    isAiImageLoading ||
    options.some((option) => option.error);

  const handleDeleteCategory = () => {
    if (!selectedEditMenu || isEmpty(selectedEditMenu) || !restaurantId) {
      return;
    }

    showConfirm({
      title: CONFIRM_DIALOG_MESSAGE.DELETE_CATEGORY.TITLE,
      message: CONFIRM_DIALOG_MESSAGE.DELETE_CATEGORY.MESSAGE,
      confirmText: CONFIRM_DIALOG_MESSAGE.DELETE_CATEGORY.CONFIRM_TEXT,
      cancelText: CONFIRM_DIALOG_MESSAGE.DELETE_CATEGORY.CANCEL_TEXT,
      buttonType: "fatal",
      onConfirm: async () => {
        let deleteParams: DeleteObjectCommandInput | null = null;
        if (selectedEditMenu.imageUrl) {
          deleteParams = {
            Bucket: AWS_S3_YOSHI_BUCKET,
            Key: selectedEditMenu.imageUrl,
          };
        }

        const deletedMenuCategory = await deleteMenuItem(
          {
            menuItemId: selectedEditMenu.id,
            deleteParams,
          },
          {
            additionalKeys: [RESTAURANT_ENDPOINT.MENU_CATEGORY(restaurantId)],
          }
        );

        if (deletedMenuCategory) {
          openEditMenu(false);
          addToast("success", "Menu category deleted successfully!");
        }
      },
    });
  };

  const handleCloseCategory = () => {
    if (
      !isFormChanged(
        {
          menuName: selectedEditMenu?.name ?? "",
          price: selectedEditMenu?.price ?? 0,
          description: selectedEditMenu?.description ?? "",
          previewUrl:
            selectedEditMenu?.imageUrl &&
            `${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${
              selectedEditMenu?.imageUrl
            }?v=${selectedEditMenu?.imageVersion || 0}`,
          menuItemStatus: selectedEditMenu?.status ?? MenuItemStatus.AVAILABLE,
        },
        {
          menuName,
          price,
          description,
          previewUrl,
          menuItemStatus,
        }
      ) &&
      !isArrayOfObjectsChanged(previousOptions, options)
    ) {
      openEditMenu(false);
      return;
    }

    showConfirm({
      title: CONFIRM_DIALOG_MESSAGE.DISCARD_INPUT.TITLE,
      message: CONFIRM_DIALOG_MESSAGE.DISCARD_INPUT.MESSAGE,
      confirmText: CONFIRM_DIALOG_MESSAGE.DISCARD_INPUT.CONFIRM_TEXT,
      cancelText: CONFIRM_DIALOG_MESSAGE.DISCARD_INPUT.CANCEL_TEXT,
      buttonType: "info",
      onConfirm: () => {
        openEditMenu(false);
      },
    });
  };

  const handleCreate = async (
    menuItemInfo: CreateMenuItemParams,
    menuItemOptions: Omit<MenuItemOptionForm, "id">[],
    uploadParams: PutObjectCommandInput | null
  ) => {
    if (!restaurantId) {
      addToast(
        "error",
        "Error occurred while creating menu item. Please try again later"
      );
      return;
    }

    const newMenuItem = await createMenuItem(
      {
        menuItemInfo,
        menuItemOptions,
        uploadParams,
      },
      {
        additionalKeys: [RESTAURANT_ENDPOINT.MENU_CATEGORY(restaurantId)],
      }
    );

    if (newMenuItem) {
      openEditMenu(false);
      addToast("success", "Menu Item created successfully!");
    }
  };

  const handleUpdate = async (
    menuItemInfo: UpdateMenuItemParams,
    menuItemOptions: MenuItemOptionForm[],
    uploadParams: PutObjectCommandInput | null
  ) => {
    if (!restaurantId) {
      addToast(
        "error",
        "Error occurred while updating menu item. Please try again later"
      );
      return;
    }

    const updatedMenuItem = await updateMenuItem(
      {
        menuItemInfo,
        menuItemOptions,
        uploadParams,
      },
      {
        additionalKeys: [RESTAURANT_ENDPOINT.MENU_CATEGORY(restaurantId)],
      }
    );

    if (updatedMenuItem) {
      openEditMenu(false);
      addToast("success", "Menu Item updated successfully!");
    }
  };

  const shouldUploadImage = (): boolean => {
    if (selectedEditMenu?.imageUrl) {
      const isImageChanged =
        previewUrl && !previewUrl.includes(selectedEditMenu.imageUrl);
      const isCropped =
        renderedDimension.width !== crop?.width ||
        renderedDimension.height !== crop?.height;
      return !!isImageChanged || isCropped;
    }

    return true;
  };

  const handleSave = async (): Promise<void> => {
    if (!restaurantId || !selectedCategory) {
      addToast(
        "error",
        "Error occurred while saving menu item. Please try again later"
      );
      return;
    }

    if (!isEmpty(options)) {
      const validatedOptions = validateMenuOptions(options);
      if (validatedOptions.some((option) => option.error)) {
        dispatch({ type: "SET_OPTIONS", payload: validatedOptions });
        return;
      }
    }

    // If the imageUrl exists, use the existing imageKey
    const imageKey =
      selectedEditMenu?.imageUrl ||
      `menus/${restaurantId}/${selectedCategory.name}/${menuName}.jpg`;

    const uploadParams = await getS3UploadParams(
      croppedImage,
      imageKey,
      shouldUploadImage
    );

    if (uploadParams instanceof ApiError) {
      addToast("error", uploadParams.message);
      return;
    }

    const menuItemInfo: CreateMenuItemParams | UpdateMenuItemParams = {
      id: selectedEditMenu?.id,
      categoryId: selectedCategory?.id,
      subCategoryId:
        subCategory !== SUB_CATEGORY_VALUE_NONE ? subCategory : undefined,
      name: menuName,
      price,
      description,
      status: menuItemStatus,
      maxDailyOrders:
        menuItemStatus === MenuItemStatus.LIMITED ? maxDailyOrders : undefined,
      imageUrl: uploadParams ? imageKey : selectedEditMenu?.imageUrl || "",
      imageVersion:
        selectedEditMenu?.imageUrl && uploadParams
          ? selectedEditMenu.imageVersion + 1
          : selectedEditMenu?.imageVersion,
    };

    if (selectedEditMenu) {
      await handleUpdate(menuItemInfo, options, uploadParams);
    } else {
      await handleCreate(menuItemInfo, options, uploadParams);
    }
  };

  useEffect(() => {
    const {
      imageUrl,
      imageVersion,
      name,
      price,
      description,
      subCategoryId,
      maxDailyOrders,
      status,
    } = selectedEditMenu || {};

    if (imageUrl) {
      const previewUrl = `${
        process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL
      }/${imageUrl}?v=${imageVersion || 0}`;
      dispatch({ type: "SET_PREVIEW_URL", payload: previewUrl });
    }
    if (name) {
      dispatch({
        type: "SET_MENU_NAME",
        payload: name,
      });
    }
    if (price) {
      dispatch({
        type: "SET_PRICE",
        payload: price,
      });
    }
    if (description) {
      dispatch({
        type: "SET_DESCRIPTION",
        payload: description,
      });
    }
    if (subCategoryId) {
      dispatch({
        type: "SET_SUB_CATEGORY",
        payload: subCategoryId,
      });
    }
    if (maxDailyOrders) {
      dispatch({
        type: "SET_MAX_DAILY_ORDERS",
        payload: maxDailyOrders,
      });
    }
    if (status) {
      dispatch({
        type: "SET_MENU_ITEM_STATUS",
        payload: status,
      });
    }
    if (selectedSubCategory?.id) {
      if (selectedEditMenu?.subCategoryId) {
        dispatch({
          type: "SET_SUB_CATEGORY",
          payload: selectedEditMenu.subCategoryId,
        });
        return;
      }
      dispatch({
        type: "SET_SUB_CATEGORY",
        payload: selectedSubCategory.id,
      });
    }
  }, [
    selectedEditMenu?.imageUrl,
    selectedEditMenu?.imageVersion,
    selectedEditMenu?.name,
    selectedEditMenu?.price,
    selectedEditMenu?.description,
    selectedEditMenu?.status,
    selectedEditMenu?.subCategoryId,
    selectedEditMenu?.maxDailyOrders,
    selectedSubCategory?.id,
  ]);

  useEffect(() => {
    if (optionCount > 10) {
      addToast("error", "The maximum number of options is 10");
      dispatch({ type: "SUBTRACT_OPTIONS" });
    }
  }, [optionCount]);

  useDeepEffect(() => {
    if (isVisible) {
      if (selectedEditMenu && !isEmpty(selectedEditMenu?.menuItemOptions)) {
        setDefaultMenuOptions(selectedEditMenu.menuItemOptions, dispatch);
        return;
      } else if (
        selectedCategory &&
        !isEmpty(selectedCategory.defaultOptions)
      ) {
        const formattedDefaultOptions = selectedCategory.defaultOptions.map(
          ({ id, name, price }) => ({ categoryOptionId: id, name, price })
        );
        dispatch({
          type: "SET_DEFAULT_OPTIONS",
          payload: {
            options: formattedDefaultOptions,
            optionCount: formattedDefaultOptions.length,
            previousOptions: formattedDefaultOptions,
          },
        });
      }
    }
  }, [
    selectedCategory?.defaultOptions,
    selectedEditMenu?.menuItemOptions,
    isVisible,
  ]);

  useEffect(() => {
    if (createMenuItemErr) {
      addToast("error", createMenuItemErr.message);
    }
  }, [createMenuItemErr]);

  useEffect(() => {
    if (updateMenuItemErr) {
      addToast("error", updateMenuItemErr.message);
    }
  }, [updateMenuItemErr]);

  useEffect(() => {
    if (deleteMenuItemErr) {
      addToast("error", deleteMenuItemErr.message);
    }
  }, [deleteMenuItemErr]);

  useEffect(() => {
    if (createAiImageErr) {
      addToast("error", createAiImageErr.message);
    }
  }, [createAiImageErr]);

  useEffect(() => {
    if (!isVisible) {
      dispatch({ type: "RESET" });
      setSelectedEditMenu(null);
    }
  }, [isVisible]);

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      {(createMenuItemLoading ||
        updateMenuItemLoading ||
        deleteMenuItemLoading ||
        createAiImageLoading) && <LoadingOverlay />}
      <canvas
        ref={canvasRef}
        className="hidden"
        aria-label="Gets the image of image container"
      ></canvas>
      <canvas
        ref={cropCanvasRef}
        className="hidden"
        aria-label="Gets the image of crop container"
      ></canvas>
      <div
        className={`absolute inset-0 top-4 transform transition-transform duration-300 ease-in-out ${
          isVisible ? "z-30" : "z-0"
        }`}
        style={{
          transform: `translateY(${isVisible ? "0%" : "100%"})`,
        }}
      >
        {isVisible && (
          <div className="flex flex-col overflow-y-scroll h-full max-h-[47rem] p-4 bg-white rounded-t-[2rem] scrollbar-hide">
            <div className="flex justify-between mb-12">
              <button
                onClick={handleCloseCategory}
                className="absolute z-10 p-2 text-sm text-black bg-gray-200 border-4 border-white rounded-full hover:bg-gray-300"
              >
                Back
              </button>
              <div className="absolute z-10 right-0 flex space-x-0.5 bg-white -top-0">
                <button
                  onClick={() => dispatch({ type: "ACTIVE_TAP_ESSENTIAL" })}
                  className={`px-4 py-2 ${
                    activeTab === "essential"
                      ? "font-semibold"
                      : `${
                          menuName.length <= 0 || price <= 0
                            ? "bg-red-200 hover:bg-red-300"
                            : "bg-gray-200 hover:bg-gray-300"
                        } shadow-[inset_1px_-1px_2px_rgba(0,0,0,0.2)]`
                  } rounded-l`}
                >
                  Essential
                </button>
                <button
                  onClick={() => dispatch({ type: "ACTIVE_TAP_OPTIONAL" })}
                  className={`px-4 py-2 ${
                    activeTab === "optional"
                      ? "font-semibold"
                      : `${
                          options.some((option) => option.error)
                            ? "bg-red-200 hover:bg-red-300"
                            : "bg-gray-200 hover:bg-gray-300"
                        } shadow-[inset_1px_-1px_2px_rgba(0,0,0,0.2)]`
                  } rounded-r`}
                >
                  Optional
                </button>
              </div>
            </div>
            {activeTab === "essential" && (
              <div className="relative flex flex-col space-y-4">
                <div className="relative">
                  <input
                    onChange={(e) =>
                      dispatch({
                        type: "SET_MENU_NAME",
                        payload: e.target.value,
                      })
                    }
                    className={`p-2 border-b-2 ${
                      isMobile ? "w-full" : "w-3/4"
                    }`}
                    type="text"
                    value={menuName}
                    placeholder="Enter menu name (example: Chicken Burger)"
                  />
                  <span className="absolute text-sm text-red-500 right-5">
                    {menuName.length <= 0 && "※ Category name is required"}
                  </span>
                </div>
                <div className="relative">
                  <input
                    onChange={(e) =>
                      dispatch({
                        type: "SET_PRICE",
                        payload: Number(e.target.value),
                      })
                    }
                    className={`p-2 border-b-2 ${
                      isMobile ? "w-full" : "w-3/4"
                    }`}
                    type="number"
                    value={price}
                    placeholder="Enter menu price (example: 990))"
                  />
                  <span className="absolute top-0 text-sm text-red-500 right-5">
                    {price <= 0 && "※ Price is required"}
                  </span>
                </div>
                <ImageEdit
                  createAiImage={createAiImage}
                  imageInfo={{
                    triggerName: menuName,
                    crop,
                    renderedDimension,
                    isAiImageLoading,
                    previewUrl,
                    shouldProcessCrop,
                  }}
                  canvasInfo={{ canvasRef, cropCanvasRef }}
                  dispatch={dispatch}
                />
                <textarea
                  onChange={(e) =>
                    dispatch({
                      type: "SET_DESCRIPTION",
                      payload: e.target.value,
                    })
                  }
                  className="w-full h-24 p-2 border-2 resize-none"
                  value={description}
                  placeholder="Enter description"
                />
                <div className="flex-wrap items-center">
                  <label className="whitespace-nowrap">Sub-category:</label>
                  <div className="w-full mt-2">
                    <select
                      value={subCategory ?? SUB_CATEGORY_VALUE_NONE}
                      onChange={(e) =>
                        dispatch({
                          type: "SET_SUB_CATEGORY",
                          payload: e.target.value,
                        })
                      }
                      className="w-full h-10 px-3 py-2 text-base text-gray-900 placeholder-gray-500 border rounded-lg focus:shadow-outline-blue focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      name="subCategory"
                    >
                      <option value={SUB_CATEGORY_VALUE_NONE}>
                        {SUB_CATEGORY_VALUE_NONE}
                      </option>
                      {selectedCategory?.subCategories.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "optional" && (
              <OptionsEdit
                optionsInfo={{
                  options,
                  menuStatus: {
                    type: "item",
                    status: menuItemStatus,
                  },
                  maxDailyOrders,
                }}
                dispatch={dispatch}
              />
            )}
            <hr className="mt-6" />
            <div
              className={`flex mt-3 ${
                selectedEditMenu ? "justify-between" : "self-end"
              }`}
            >
              {selectedEditMenu && (
                <button
                  onClick={handleDeleteCategory}
                  disabled={menuName.length <= 0 || isAiImageLoading}
                  className={`px-6 py-2 text-white transition duration-200 ${
                    menuName.length <= 0 || isAiImageLoading
                      ? "cursor-not-allowed bg-red-400"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  Delete
                </button>
              )}
              <div className="space-x-2">
                <button
                  onClick={handleCloseCategory}
                  className="px-6 py-2 text-black transition duration-200 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    await withLoading(handleSave);
                  }}
                  disabled={isDisabled}
                  className={`px-6 py-2 text-white transition duration-200  rounded ${
                    isDisabled
                      ? "cursor-not-allowed bg-green-400"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
