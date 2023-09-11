/* eslint-disable @next/next/no-img-element */
import {
  OPEN_AI_IMAGE_ENDPOINT,
  RESTAURANT_ENDPOINT,
} from "@/constants/endpoint";
import { Method } from "@/constants/fetch";
import {
  PICTURE_CROP_MIN_HEIGHT,
  PICTURE_CROP_MIN_SIZE,
  PICTURE_CROP_MIN_WIDTH,
  PICTURE_MAX_CAPACITY,
} from "@/constants/menu";
import { CONFIRM_DIALOG_MESSAGE } from "@/constants/message/confirm";
import {
  AWS_S3_PUT_OBJECT_CACHE_CONTROL,
  AWS_S3_YOSHI_BUCKET,
} from "@/constants/service";
import { CreateMenuCategoryParams, UpdateMenuCategoryParams } from "@/database";
import useLoading from "@/hooks/context/useLoading";
import { useConfirm } from "@/hooks/useConfirm";
import useDeepEffect from "@/hooks/useDeepEffect";
import { useToast } from "@/hooks/useToast";
import useMutation from "@/lib/client/useMutation";
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
import generateNextImageURL from "@/utils/generateNextImageURL";
import isEmpty from "@/utils/validation/isEmpty";
import isFormChanged from "@/utils/validation/isFormChanged";
import isPositiveInteger from "@/utils/validation/isPositiveInteger";
import {
  DeleteObjectCommandInput,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { MenuCategory, MenuCategoryStatus } from "@prisma/client";
import { SyntheticEvent, useEffect, useReducer, useRef } from "react";
import ReactCrop, { Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useRecoilState } from "recoil";
import LoadingOverlay from "../LoadingOverlay";
import isArrayOfObjectsChanged from "@/utils/validation/isArrayOfObjectsChanged";

type MenuCategoryEditProps = {
  restaurantId: string | undefined | null;
};
export interface MenuCategoryOptionForm {
  id?: string;
  name: string;
  price: number | "";
  error?: string;
}
interface MenuCategoryEditState {
  selectedFile: File | null;
  previewUrl: string | null;
  crop: Crop | undefined;
  categoryName: string;
  description: string;
  isAiImageLoading: boolean;
  croppedImage: Blob | null;
  renderedDimension: { width: number; height: number };
  shouldProcessCrop: boolean;
  activeTab: "essential" | "optional";
  options: MenuCategoryOptionForm[];
  menuCategoryStatus: MenuCategoryStatus;
  optionCount: number;
  previousOptions: MenuCategoryOptionForm[];
}

type MenuCategoryEditAction =
  | { type: "RESET" }
  | { type: "SET_CATEGORY_NAME"; payload: string }
  | { type: "SET_CROPPED_IMAGE"; payload: Blob }
  | { type: "SET_DESCRIPTION"; payload: string }
  | { type: "SET_PREVIEW_URL"; payload: string }
  | { type: "SET_CROP"; payload: Crop }
  | {
      type: "SET_RENDERED_DIMENSION";
      payload: { width: number; height: number };
    }
  | { type: "START_AI_IMAGE_CREATION" }
  | { type: "END_AI_IMAGE_CREATION" }
  | { type: "RESET_SHOULD_PROCESS_CROP" }
  | {
      type: "ON_IMAGE_LOAD";
      payload: {
        currentTarget: HTMLImageElement;
        containerWidth: number;
        containerHeight: number;
      };
    }
  | {
      type: "HANDLE_FILE_CHANGE";
      payload: { selectedFile: File; previewUrl: string };
    }
  | {
      type: "ACTIVE_TAP_ESSENTIAL";
    }
  | {
      type: "ACTIVE_TAP_OPTIONAL";
    }
  | { type: "SET_OPTIONS"; payload: MenuCategoryOptionForm[] }
  | { type: "SET_MENU_CATEGORY_STATUS"; payload: MenuCategoryStatus }
  | { type: "SET_FORM_ERROR"; payload: boolean }
  | { type: "ADD_OPTIONS"; payload: MenuCategoryOptionForm[] }
  | { type: "SUBTRACT_OPTIONS" }
  | { type: "HANDLE_REMOVE_OPTION"; payload: MenuCategoryOptionForm[] }
  | {
      type: "SET_DEFAULT_OPTIONS";
      payload: {
        options: MenuCategoryOptionForm[];
        optionCount: number;
        previousOptions: MenuCategoryOptionForm[];
      };
    };

const initialOptions: MenuCategoryOptionForm = { name: "", price: "" };

const initialState: MenuCategoryEditState = {
  selectedFile: null,
  previewUrl: null,
  crop: undefined,
  categoryName: "",
  description: "",
  isAiImageLoading: false,
  croppedImage: null,
  renderedDimension: { width: 0, height: 0 },
  shouldProcessCrop: false,
  activeTab: "essential",
  options: [],
  menuCategoryStatus: MenuCategoryStatus.AVAILABLE,
  optionCount: 0,
  previousOptions: [],
};

const reducer = (
  state: MenuCategoryEditState,
  action: MenuCategoryEditAction
): MenuCategoryEditState => {
  switch (action.type) {
    case "RESET":
      return initialState;
    case "SET_CATEGORY_NAME":
      return { ...state, categoryName: action.payload };
    case "SET_CROPPED_IMAGE":
      return { ...state, croppedImage: action.payload };
    case "SET_DESCRIPTION":
      return { ...state, description: action.payload };
    case "SET_RENDERED_DIMENSION":
      return { ...state, renderedDimension: action.payload };
    case "SET_PREVIEW_URL":
      return { ...state, previewUrl: action.payload };
    case "SET_CROP":
      return { ...state, crop: action.payload };
    case "START_AI_IMAGE_CREATION":
      return { ...state, isAiImageLoading: true };
    case "END_AI_IMAGE_CREATION":
      return { ...state, isAiImageLoading: false };
    case "HANDLE_FILE_CHANGE": {
      const { selectedFile, previewUrl } = action.payload;
      return { ...state, selectedFile, previewUrl };
    }
    case "RESET_SHOULD_PROCESS_CROP":
      return { ...state, shouldProcessCrop: false };
    case "ACTIVE_TAP_ESSENTIAL":
      return { ...state, activeTab: "essential" };
    case "ACTIVE_TAP_OPTIONAL":
      return { ...state, activeTab: "optional" };
    case "SET_OPTIONS": {
      return { ...state, options: action.payload };
    }
    case "SET_MENU_CATEGORY_STATUS":
      return { ...state, menuCategoryStatus: action.payload };
    case "ADD_OPTIONS": {
      if (state.optionCount >= 10) {
        return { ...state, optionCount: state.optionCount + 1 };
      }
      return {
        ...state,
        options: action.payload,
        optionCount: state.optionCount + 1,
      };
    }
    case "SUBTRACT_OPTIONS": {
      if (state.optionCount <= 0) {
        return state;
      }
      return { ...state, optionCount: state.optionCount - 1 };
    }
    case "HANDLE_REMOVE_OPTION":
      return {
        ...state,
        options: action.payload,
        optionCount: state.optionCount - 1,
      };
    case "SET_DEFAULT_OPTIONS": {
      const { options, optionCount, previousOptions } = action.payload;
      return { ...state, options, optionCount, previousOptions };
    }
    case "ON_IMAGE_LOAD": {
      const { currentTarget, containerWidth, containerHeight } = action.payload;
      const { clientWidth: width, clientHeight: height } = currentTarget;
      const x = (containerWidth - width) / 2;
      const y = (containerHeight - height) / 2;

      const newCrop: Crop = {
        unit: "px",
        x,
        y,
        width,
        height,
      };

      return {
        ...state,
        renderedDimension: { width, height },
        crop: newCrop,
        shouldProcessCrop: true,
      };
    }

    default:
      return state;
  }
};

const validateMenuCategoryOptions = (
  options: MenuCategoryOptionForm[]
): MenuCategoryOptionForm[] => {
  return options.map((option) => {
    const { name, price } = option;
    if (name.length <= 0) {
      return { ...option, error: "※ Name is required" };
    }
    if (!price) {
      return { ...option, error: "※ Price is required" };
    }

    if (!isPositiveInteger(Number(price))) {
      return { ...option, error: "※ Price must be a positive Integer" };
    }

    const { error: _, ...restOption } = option;
    return { ...restOption, price: Number(price) };
  });
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
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
  ] = useReducer(reducer, initialState);

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

  const paintCanvas = async (imageSrc: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      const image = new Image();
      generateNextImageURL(image, imageSrc);
      image.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          addToast("error", "Error occurred while painting image");
          return;
        }

        canvas.width = renderedDimension.width;
        canvas.height = renderedDimension.height;
        const ctx = canvas.getContext("2d");

        ctx?.drawImage(
          image,
          0,
          0,
          renderedDimension.width,
          renderedDimension.height
        );
        resolve();
      };
    });
  };

  const getCroppedImg = async (
    imageSrc: string,
    newCrop: Crop
  ): Promise<Blob> => {
    try {
      if (!newCrop || isEmpty(newCrop)) {
        return new Blob();
      }

      const containerWidth = imageContainerRef.current?.clientWidth || 0;
      const containerHeight = imageContainerRef.current?.clientHeight || 0;

      // Paint the image into canvas
      await paintCanvas(imageSrc);
      const canvas = canvasRef.current;
      if (!canvas) return new Blob();

      // Calculate the cropped area
      const { x, y, width, height } = newCrop;
      const croppedX = x - (containerWidth - renderedDimension.width) / 2;
      const croppedY = y - (containerHeight - renderedDimension.height) / 2;

      // Create a new canvas for the cropped image
      const cropCanvas = cropCanvasRef.current;
      if (!cropCanvas) return new Blob();

      cropCanvas.width = width;
      cropCanvas.height = height;
      const cropCtx = cropCanvas.getContext("2d");

      // Draw the cropped image onto the new canvas
      cropCtx?.drawImage(
        canvas,
        croppedX,
        croppedY,
        width,
        height,
        0,
        0,
        width,
        height
      );

      return new Promise<Blob>((resolve) => {
        cropCanvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(new Blob());
          }
        }, "image/jpeg");
      });
    } catch (err) {
      // Send error to sentry
      console.error(err);
      return new Blob();
    }
  };

  const onImageLoad = async (
    e: SyntheticEvent<HTMLImageElement, Event>
  ): Promise<void> => {
    const { clientWidth: width, clientHeight: height } = e.currentTarget;
    const containerWidth = imageContainerRef.current?.clientWidth || width;
    const containerHeight = imageContainerRef.current?.clientHeight || height;

    dispatch({
      type: "ON_IMAGE_LOAD",
      payload: {
        currentTarget: e.currentTarget,
        containerWidth,
        containerHeight,
      },
    });

    await paintCanvas(e.currentTarget.src);
  };

  const onCropComplete = async (newCrop: Crop): Promise<void> => {
    if (!previewUrl) {
      return;
    }

    const croppedImgBlob = await getCroppedImg(previewUrl, newCrop);
    if (croppedImgBlob.size <= 0) {
      addToast("error", "Error occurred while loading image");
      return;
    }
    dispatch({ type: "SET_CROPPED_IMAGE", payload: croppedImgBlob });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      addToast("error", "File is not valid. Please choose another file");
      return;
    }

    if (file.size > PICTURE_MAX_CAPACITY) {
      addToast("error", "File size exceeds 512KB. Please choose another file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      dispatch({
        type: "HANDLE_FILE_CHANGE",
        payload: { selectedFile: file, previewUrl: reader.result as string },
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCreateAiImage = async (): Promise<void> => {
    dispatch({ type: "START_AI_IMAGE_CREATION" });

    try {
      const result = await createAiImage({ categoryName });
      if (result && result.data.length > 0) {
        dispatch({ type: "SET_PREVIEW_URL", payload: result.data[0].url });
        await paintCanvas(result.data[0].url);
      }
    } finally {
      dispatch({ type: "END_AI_IMAGE_CREATION" });
    }
  };

  const getS3UploadParams = async (
    croppedImage: Blob,
    imageKey: string
  ): Promise<PutObjectCommandInput | null> => {
    try {
      const arrayBuffer = await croppedImage.arrayBuffer();
      const croppedImageBuffer = Buffer.from(arrayBuffer);

      return {
        Bucket: AWS_S3_YOSHI_BUCKET,
        Key: imageKey,
        Body: croppedImageBuffer,
        ContentType: croppedImage.type,
        CacheControl: AWS_S3_PUT_OBJECT_CACHE_CONTROL,
        ContentLength: croppedImage.size,
      };
    } catch (err) {
      addToast("error", "Error occurred while uploading menu category");
      return null;
    }
  };

  const removeOptionAtIndex = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    dispatch({ type: "HANDLE_REMOVE_OPTION", payload: newOptions });
  };

  const handleOptionChange = (
    field: keyof MenuCategoryOptionForm,
    value: string | number,
    index: number
  ) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    const validatedOptions = validateMenuCategoryOptions(newOptions);
    dispatch({ type: "SET_OPTIONS", payload: validatedOptions });
  };

  const handleRemoveOption = (index: number) => {
    if (options[index]?.id) {
      showConfirm({
        title: CONFIRM_DIALOG_MESSAGE.DELETE_CATEGORY_OPTION.TITLE,
        message: CONFIRM_DIALOG_MESSAGE.DELETE_CATEGORY_OPTION.MESSAGE,
        confirmText: CONFIRM_DIALOG_MESSAGE.DELETE_CATEGORY_OPTION.CONFIRM_TEXT,
        cancelText: CONFIRM_DIALOG_MESSAGE.DELETE_CATEGORY_OPTION.CANCEL_TEXT,
        buttonType: "fatal",
        onConfirm: () => removeOptionAtIndex(index),
      });
    } else {
      removeOptionAtIndex(index);
    }
  };

  const handleCreate = async (
    menuCategoryInfo: CreateMenuCategoryParams,
    menuCategoryOptions: Omit<MenuCategoryOptionForm, "id">[],
    uploadParams: PutObjectCommandInput | null
  ) => {
    const newMenuCategory = await createCategory({
      menuCategoryInfo,
      menuCategoryOptions,
      uploadParams,
    });

    if (newMenuCategory) {
      openEditCategory(false);
      addToast("success", "Menu category created successfully!");
    }
  };

  const handleUpdate = async (
    menuCategoryInfo: UpdateMenuCategoryParams,
    menuCategoryOptions: MenuCategoryOptionForm[],
    uploadParams: PutObjectCommandInput | null
  ) => {
    const updatedMenuCategory = await updateCategory({
      menuCategoryInfo,
      menuCategoryOptions,
      uploadParams,
    });

    if (updatedMenuCategory) {
      openEditCategory(false);
      addToast("success", "Menu Category updated successfully!");
    }
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
      const validatedOptions = validateMenuCategoryOptions(options);
      if (validatedOptions.some((option) => option.error)) {
        dispatch({ type: "SET_OPTIONS", payload: validatedOptions });
        return;
      }
    }

    // If the imageUrl exists, use the existing imageKey
    const imageKey =
      selectedEditCategory?.imageUrl ||
      `menus/${restaurantId}/_category_${categoryName}.jpg`;

    // If the image exists and croppedImage is null, No need to upload the image to S3
    const uploadParams =
      croppedImage && croppedImage.size > PICTURE_CROP_MIN_SIZE
        ? await getS3UploadParams(croppedImage, imageKey)
        : null;

    const menuCategoryInfo = {
      id: selectedEditCategory?.id,
      restaurantId,
      name: categoryName,
      description,
      status: menuCategoryStatus,
      imageUrl: uploadParams ? imageKey : "",
      imageVersion:
        selectedEditCategory?.imageUrl && uploadParams
          ? selectedEditCategory.imageVersion + 1
          : selectedEditCategory?.imageVersion,
    };

    if (selectedEditCategory) {
      handleUpdate(menuCategoryInfo, options, uploadParams);
    } else {
      handleCreate(menuCategoryInfo, options, uploadParams);
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

  useDeepEffect(() => {
    const { defaultOptions } = selectedEditCategory || {};
    if (defaultOptions && !isEmpty(defaultOptions)) {
      const formattedDefaultOptions = defaultOptions.map(
        ({ id, name, price }) => ({ id, name, price })
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
  }, [selectedEditCategory?.defaultOptions]);

  useEffect(() => {
    if (crop && shouldProcessCrop) {
      onCropComplete(crop);
      dispatch({ type: "RESET_SHOULD_PROCESS_CROP" });
    }
  }, [shouldProcessCrop]);

  useEffect(() => {
    if (optionCount > 10) {
      addToast("error", "The maximum number of options is 10");
      dispatch({ type: "SUBTRACT_OPTIONS" });
    }
  }, [optionCount]);

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
      <canvas ref={canvasRef} className="hidden"></canvas>
      <canvas ref={cropCanvasRef} className="hidden"></canvas>
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
                <div className="flex flex-col items-center p-2 border-2 rounded">
                  <label className="hidden">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <div
                    ref={imageContainerRef}
                    className="flex items-center justify-center w-full bg-gray-200 rounded h-112"
                  >
                    {previewUrl && (
                      <ReactCrop
                        crop={crop}
                        minWidth={PICTURE_CROP_MIN_WIDTH}
                        minHeight={PICTURE_CROP_MIN_HEIGHT}
                        maxWidth={renderedDimension.width}
                        maxHeight={renderedDimension.height}
                        onChange={(newCrop) =>
                          dispatch({ type: "SET_CROP", payload: newCrop })
                        }
                        onComplete={(crop) => onCropComplete(crop)}
                        className="relative w-full h-full"
                      >
                        <img
                          className="object-contain mx-auto h-112"
                          alt="Preview"
                          draggable={false}
                          src={previewUrl}
                          onLoad={onImageLoad}
                        />
                      </ReactCrop>
                    )}
                  </div>
                  <div className="flex w-full space-x-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 mt-2 text-white transition bg-blue-500 rounded hover:bg-blue-600"
                    >
                      Upload Image
                    </button>
                    <button
                      onClick={handleCreateAiImage}
                      disabled={categoryName.length <= 0 || isAiImageLoading}
                      className={`w-full py-2 mt-2 text-white transition rounded ${
                        categoryName.length <= 0 || isAiImageLoading
                          ? "cursor-not-allowed bg-lime-400"
                          : "bg-lime-500 hover:bg-lime-600"
                      }`}
                    >
                      Generate Image with AI
                    </button>
                  </div>
                </div>
                <textarea
                  onChange={onDescriptionChange}
                  className="w-full h-24 p-2 border-2 resize-none"
                  value={description}
                  placeholder="Enter description"
                />
              </div>
            )}
            {activeTab === "optional" && (
              <>
                <div className="flex-wrap mt-2 indent-2">
                  <label className="text-lg font-semibold">
                    Category Status:
                  </label>
                </div>
                <div className="flex p-2 mt-2 border-2 rounded">
                  <div className="flex flex-wrap space-x-2">
                    {Object.keys(MenuCategoryStatus).map((status, idx) => (
                      <label
                        key={idx}
                        className="flex items-center p-1 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="menuCategoryStatus"
                          value={status}
                          checked={menuCategoryStatus === status}
                          onChange={() =>
                            dispatch({
                              type: "SET_MENU_CATEGORY_STATUS",
                              payload: status as MenuCategoryStatus,
                            })
                          }
                          className="hidden"
                        />
                        <div
                          className={`flex items-center px-2 py-1 border-2 rounded ${
                            menuCategoryStatus === status
                              ? "border-blue-500"
                              : "border-gray-300 hover:border-blue-400"
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full ${
                              menuCategoryStatus === status
                                ? "bg-blue-500"
                                : "bg-gray-300"
                            }`}
                          ></span>
                          <span className="ml-2 text-sm">{status}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-wrap items-center mt-6">
                    <h2 className="text-lg font-semibold indent-2">
                      Default Menu Options
                    </h2>
                    <button
                      onClick={() =>
                        dispatch({
                          type: "ADD_OPTIONS",
                          payload: [...options, initialOptions],
                        })
                      }
                      className="ml-2 px-3 py-1.5 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                    >
                      Add Option +
                    </button>
                  </div>
                  {options.map((option, index) => (
                    <div key={index} className="flex flex-col">
                      <div className="flex items-center space-x-4">
                        <input
                          type="text"
                          placeholder="Option Name"
                          value={option.name}
                          onChange={(e) =>
                            handleOptionChange("name", e.target.value, index)
                          }
                          className="w-1/2 p-2 border rounded"
                        />
                        <input
                          type="number"
                          placeholder="Price (+)"
                          value={option.price}
                          onChange={(e) =>
                            handleOptionChange("price", e.target.value, index)
                          }
                          className="w-1/4 p-2 border rounded"
                        />
                        <button
                          onClick={() => handleRemoveOption(index)}
                          className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                      {option.error && (
                        <span className="text-sm text-red-500">
                          {option.error}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </>
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
                  disabled={
                    categoryName.length <= 0 ||
                    isAiImageLoading ||
                    options.some((option) => option.error)
                  }
                  className={`px-6 py-2 text-white transition duration-200  rounded ${
                    categoryName.length <= 0 ||
                    isAiImageLoading ||
                    options.some((option) => option.error)
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
