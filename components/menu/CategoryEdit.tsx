/* eslint-disable @next/next/no-img-element */
import {
  OPEN_AI_IMAGE_ENDPOINT,
  RESTAURANT_ENDPOINT,
} from "@/constants/endpoint";
import { Method } from "@/constants/fetch";
import { CONFIRM_DIALOG_MESSAGE } from "@/constants/message/confirm";
import { AWS_S3_YOSHI_BUCKET } from "@/constants/service";
import { CreateMenuCategoryParams, UpdateMenuCategoryParams } from "@/database";
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
  IDeleteMenuCategoryBody,
  IPatchMenuCategoryBody,
  IPostMenuCategoryBody,
} from "@/pages/api/v1/restaurants/[restaurantId]/menu-categories";
import {
  selectedEditCategoryState,
  showCategoryEditState,
} from "@/recoil/state/menuState";
import menuCategoryEditReducer, {
  initialEditCategoryState,
} from "@/reducers/menu/menuCategoryEditReducer";
import getS3UploadParams from "@/utils/menu/getS3UploadParams";
import setDefaultMenuOptions from "@/utils/menu/setDefaultMenuOptions";
import validateMenuOptions, {
  MenuOptionForm,
} from "@/utils/menu/validateMenuOptions";
import isArrayOfObjectsChanged from "@/utils/validation/isArrayOfObjectsChanged";
import isEmpty from "@/utils/validation/isEmpty";
import isFormChanged from "@/utils/validation/isFormChanged";
import {
  DeleteObjectCommandInput,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { MenuCategory, MenuCategoryStatus } from "@prisma/client";
import { useEffect, useReducer, useRef } from "react";
import "react-image-crop/dist/ReactCrop.css";
import { useRecoilState } from "recoil";
import LoadingOverlay from "../LoadingOverlay";
import ImageEdit from "./ImageEdit";
import OptionsEdit from "./OptionsEdit";

type MenuCategoryEditProps = {
  restaurantId: string | undefined | null;
};

export default function CategoryEdit({ restaurantId }: MenuCategoryEditProps) {
  const [
    createCategory,
    { error: createCategoryErr, loading: createCategoryLoading },
  ] = useMutation<MenuCategory, IPostMenuCategoryBody>(
    restaurantId ? RESTAURANT_ENDPOINT.MENU_CATEGORY(restaurantId) : null,
    Method.POST
  );
  const [
    updateCategory,
    { error: updateCategoryErr, loading: updateCategoryLoading },
  ] = useMutation<MenuCategory, IPatchMenuCategoryBody>(
    restaurantId ? RESTAURANT_ENDPOINT.MENU_CATEGORY(restaurantId) : null,
    Method.PATCH
  );
  const [
    deleteCategory,
    { error: deleteCategoryErr, loading: deleteCategoryLoading },
  ] = useMutation<MenuCategory, IDeleteMenuCategoryBody>(
    restaurantId ? RESTAURANT_ENDPOINT.MENU_CATEGORY(restaurantId) : null,
    Method.DELETE
  );
  const [
    createAiImage,
    { error: createAiImageErr, loading: createAiImageLoading },
  ] = useMutation<IPostOpenAiImageResponse, IPostOpenAiImageBody>(
    OPEN_AI_IMAGE_ENDPOINT.BASE,
    Method.POST
  );
  const [isVisible, openEditCategory] = useRecoilState(showCategoryEditState);
  const [selectedEditCategory, setSelectedEditCategory] = useRecoilState(
    selectedEditCategoryState
  );
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
      categoryName,
      description,
      isAiImageLoading,
      croppedImage,
      renderedDimension,
      shouldProcessCrop,
      activeTab,
      options,
      menuCategoryStatus,
      optionCount,
      previousOptions,
    },
    dispatch,
  ] = useReducer(menuCategoryEditReducer, initialEditCategoryState);

  const isDisabled =
    categoryName.length <= 0 ||
    isAiImageLoading ||
    options.some((option) => option.error);

  const onCategoryNameChange = (
    event: React.SyntheticEvent<HTMLInputElement>
  ): void => {
    const {
      currentTarget: { value },
    } = event;
    dispatch({ type: "SET_CATEGORY_NAME", payload: value });
  };

  const onDescriptionChange = (
    event: React.SyntheticEvent<HTMLTextAreaElement>
  ): void => {
    const {
      currentTarget: { value },
    } = event;
    dispatch({ type: "SET_DESCRIPTION", payload: value });
  };

  const handleDeleteCategory = () => {
    if (!selectedEditCategory || isEmpty(selectedEditCategory)) {
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
        if (selectedEditCategory.imageUrl) {
          deleteParams = {
            Bucket: AWS_S3_YOSHI_BUCKET,
            Key: selectedEditCategory.imageUrl,
          };
        }

        const deletedMenuCategory = await deleteCategory(
          {
            menuCategoryId: selectedEditCategory.id,
            deleteParams,
          },
          {
            additionalKeys: [
              RESTAURANT_ENDPOINT.MENU_CATEGORY(
                selectedEditCategory.restaurantId
              ),
            ],
          }
        );

        if (deletedMenuCategory) {
          openEditCategory(false);
          addToast("success", "Menu category deleted successfully!");
        }
      },
    });
  };

  const handleCloseCategory = () => {
    if (
      !isFormChanged(
        {
          categoryName: selectedEditCategory?.name ?? "",
          description: selectedEditCategory?.description ?? "",
          previewUrl:
            selectedEditCategory?.imageUrl &&
            `${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${
              selectedEditCategory?.imageUrl
            }?v=${selectedEditCategory?.imageVersion || 0}`,
          menuCategoryStatus:
            selectedEditCategory?.status ?? MenuCategoryStatus.AVAILABLE,
        },
        {
          categoryName,
          description,
          previewUrl,
          menuCategoryStatus,
        }
      ) &&
      !isArrayOfObjectsChanged(previousOptions, options)
    ) {
      openEditCategory(false);
      return;
    }

    showConfirm({
      title: CONFIRM_DIALOG_MESSAGE.DISCARD_INPUT.TITLE,
      message: CONFIRM_DIALOG_MESSAGE.DISCARD_INPUT.MESSAGE,
      confirmText: CONFIRM_DIALOG_MESSAGE.DISCARD_INPUT.CONFIRM_TEXT,
      cancelText: CONFIRM_DIALOG_MESSAGE.DISCARD_INPUT.CANCEL_TEXT,
      buttonType: "info",
      onConfirm: () => {
        openEditCategory(false);
      },
    });
  };

  const handleCreate = async (
    menuCategoryInfo: CreateMenuCategoryParams,
    menuCategoryOptions: Omit<MenuOptionForm, "id">[],
    uploadParams: PutObjectCommandInput | null
  ) => {
    if (!restaurantId) {
      addToast(
        "error",
        "Error occurred while creating menu category. Please try again later"
      );
      return;
    }

    const newMenuCategory = await createCategory(
      {
        menuCategoryInfo,
        menuCategoryOptions,
        uploadParams,
      },
      {
        additionalKeys: [RESTAURANT_ENDPOINT.MENU_CATEGORY(restaurantId)],
      }
    );

    if (newMenuCategory) {
      openEditCategory(false);
      addToast("success", "Menu category created successfully!");
    }
  };

  const handleUpdate = async (
    menuCategoryInfo: UpdateMenuCategoryParams,
    menuCategoryOptions: MenuOptionForm[],
    uploadParams: PutObjectCommandInput | null
  ) => {
    if (!restaurantId) {
      addToast(
        "error",
        "Error occurred while updating menu category. Please try again later"
      );
      return;
    }

    const updatedMenuCategory = await updateCategory(
      {
        menuCategoryInfo,
        menuCategoryOptions,
        uploadParams,
      },
      {
        additionalKeys: [RESTAURANT_ENDPOINT.MENU_CATEGORY(restaurantId)],
      }
    );

    if (updatedMenuCategory) {
      openEditCategory(false);
      addToast("success", "Menu Category updated successfully!");
    }
  };

  const shouldUploadImage = (): boolean => {
    if (selectedEditCategory?.imageUrl) {
      const isImageChanged =
        previewUrl && !previewUrl.includes(selectedEditCategory.imageUrl);
      const isCropped =
        renderedDimension.width !== crop?.width ||
        renderedDimension.height !== crop?.height;
      return !!isImageChanged || isCropped;
    }

    return true;
  };

  const handleSave = async (): Promise<void> => {
    if (!restaurantId) {
      addToast(
        "error",
        "Error occurred while saving menu category. Please try again later"
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
      selectedEditCategory?.imageUrl ||
      `menus/${restaurantId}/_category_${categoryName}.jpg`;

    const uploadParams = await getS3UploadParams(
      croppedImage,
      imageKey,
      shouldUploadImage
    );

    if (uploadParams instanceof ApiError) {
      addToast("error", uploadParams.message);
      return;
    }

    const menuCategoryInfo:
      | CreateMenuCategoryParams
      | UpdateMenuCategoryParams = {
      id: selectedEditCategory?.id,
      restaurantId,
      name: categoryName,
      description,
      status: menuCategoryStatus,
      imageUrl: uploadParams ? imageKey : selectedEditCategory?.imageUrl || "",
      imageVersion:
        selectedEditCategory?.imageUrl && uploadParams
          ? selectedEditCategory.imageVersion + 1
          : selectedEditCategory?.imageVersion,
    };

    if (selectedEditCategory) {
      await handleUpdate(menuCategoryInfo, options, uploadParams);
    } else {
      await handleCreate(menuCategoryInfo, options, uploadParams);
    }
  };

  useEffect(() => {
    const { imageUrl, imageVersion, name, description, status } =
      selectedEditCategory || {};

    if (imageUrl) {
      const previewUrl = `${
        process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL
      }/${imageUrl}?v=${imageVersion || 0}`;
      dispatch({ type: "SET_PREVIEW_URL", payload: previewUrl });
    }
    if (name) {
      dispatch({
        type: "SET_CATEGORY_NAME",
        payload: name,
      });
    }
    if (description) {
      dispatch({
        type: "SET_DESCRIPTION",
        payload: description,
      });
    }
    if (status) {
      dispatch({
        type: "SET_MENU_CATEGORY_STATUS",
        payload: status,
      });
    }
  }, [
    selectedEditCategory?.imageUrl,
    selectedEditCategory?.imageVersion,
    selectedEditCategory?.name,
    selectedEditCategory?.description,
    selectedEditCategory?.status,
  ]);

  useEffect(() => {
    if (optionCount > 10) {
      addToast("error", "The maximum number of options is 10");
      dispatch({ type: "SUBTRACT_OPTIONS" });
    }
  }, [optionCount]);

  useDeepEffect(() => {
    if (selectedEditCategory && !isEmpty(selectedEditCategory.defaultOptions)) {
      setDefaultMenuOptions(selectedEditCategory.defaultOptions, dispatch);
    }
  }, [selectedEditCategory?.defaultOptions]);

  useEffect(() => {
    if (createCategoryErr) {
      addToast("error", createCategoryErr.message);
    }
  }, [createCategoryErr]);

  useEffect(() => {
    if (updateCategoryErr) {
      addToast("error", updateCategoryErr.message);
    }
  }, [updateCategoryErr]);

  useEffect(() => {
    if (deleteCategoryErr) {
      addToast("error", deleteCategoryErr.message);
    }
  }, [deleteCategoryErr]);

  useEffect(() => {
    if (createAiImageErr) {
      addToast("error", createAiImageErr.message);
    }
  }, [createAiImageErr]);

  useEffect(() => {
    if (!isVisible) {
      dispatch({ type: "RESET" });
      setSelectedEditCategory(null);
    }
  }, [isVisible]);

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      {(createCategoryLoading ||
        updateCategoryLoading ||
        deleteCategoryLoading ||
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
                          categoryName.length <= 0
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
                <input
                  onChange={onCategoryNameChange}
                  className={`p-2 border-b-2 w-full`}
                  type="text"
                  value={categoryName}
                  placeholder="Enter category name (example: Lunch)"
                />
                <span className="absolute text-sm text-red-500 right-5 -top-2">
                  {categoryName.length <= 0 && "※ Category name is required"}
                </span>
                <ImageEdit
                  createAiImage={createAiImage}
                  imageInfo={{
                    triggerName: categoryName,
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
                  onChange={onDescriptionChange}
                  className="w-full h-24 p-2 border-2 resize-none"
                  value={description}
                  placeholder="Enter description"
                />
              </div>
            )}
            {activeTab === "optional" && (
              <OptionsEdit
                optionsInfo={{
                  options,
                  menuStatus: {
                    type: "category",
                    status: menuCategoryStatus,
                  },
                }}
                dispatch={dispatch}
              />
            )}
            <hr className="mt-6" />
            <div
              className={`flex mt-3 ${
                selectedEditCategory ? "justify-between" : "self-end"
              }`}
            >
              {selectedEditCategory && (
                <button
                  onClick={handleDeleteCategory}
                  disabled={categoryName.length <= 0 || isAiImageLoading}
                  className={`px-6 py-2 text-white transition duration-200 ${
                    categoryName.length <= 0 || isAiImageLoading
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
