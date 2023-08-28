/* eslint-disable @next/next/no-img-element */
import {
  ME_ENDPOINT,
  OPEN_AI_IMAGE_ENDPOINT,
  RESTAURANT_ENDPOINT,
} from "@/constants/endpoint";
import { Method } from "@/constants/fetch";
import { CROP_MIN_HEIGHT, CROP_MIN_WIDTH } from "@/constants/menu";
import { CONFIRM_DIALOG_MESSAGE } from "@/constants/message/confirm";
import {
  CreateMenuCategoryParams,
  IRestaurant,
  UpdateMenuCategoryParams,
} from "@/database";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import useMutation from "@/lib/client/useMutation";
import {
  AWS_S3_PUT_OBJECT_CACHE_CONTROL,
  AWS_S3_YOSHI_BUCKET,
} from "@/lib/services/awsS3";
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
import {
  DeleteObjectCommandInput,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { MenuCategory } from "@prisma/client";
import { SyntheticEvent, useEffect, useReducer, useRef } from "react";
import ReactCrop, { Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useRecoilState } from "recoil";
import useSWR from "swr";
import LoadingOverlay from "../LoadingOverlay";

interface MenuCategoryEditState {
  selectedFile: File | null;
  previewUrl: string | null;
  crop: Crop | undefined;
  categoryName: string;
  description: string;
  isAiImageLoading: boolean;
  croppedImage: Blob | null;
  renderedDimension: { width: number; height: number };
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
    };

const initialState: MenuCategoryEditState = {
  selectedFile: null,
  previewUrl: null,
  crop: undefined,
  categoryName: "",
  description: "",
  isAiImageLoading: false,
  croppedImage: null,
  renderedDimension: { width: 0, height: 0 },
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
      };
    }

    default:
      return state;
  }
};

export default function CategoryEdit() {
  const {
    data: restaurantInfo,
    error: restaurantInfoErr,
    isValidating: restaurantInfoLoading,
  } = useSWR<IRestaurant>(ME_ENDPOINT.RESTAURANT, {
    revalidateOnFocus: false,
    revalidateOnMount: false,
  });
  const [
    createCategory,
    { error: createCategoryErr, loading: createCategoryLoading },
  ] = useMutation<MenuCategory, IPostMenuCategoryBody>(
    RESTAURANT_ENDPOINT.MENU_CATEGORY(restaurantInfo ? restaurantInfo.id : ""),
    Method.POST
  );
  const [
    updateCategory,
    { error: updateCategoryErr, loading: updateCategoryLoading },
  ] = useMutation<MenuCategory, IPatchMenuCategoryBody>(
    RESTAURANT_ENDPOINT.MENU_CATEGORY(restaurantInfo ? restaurantInfo.id : ""),
    Method.PATCH
  );
  const [
    deleteCategory,
    { error: deleteCategoryErr, loading: deleteCategoryLoading },
  ] = useMutation<MenuCategory, IDeleteMenuCategoryBody>(
    RESTAURANT_ENDPOINT.MENU_CATEGORY(restaurantInfo ? restaurantInfo.id : ""),
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
    },
    dispatch,
  ] = useReducer(reducer, initialState);

  const onCategoryNameChange = (
    event: React.SyntheticEvent<HTMLInputElement>
  ) => {
    const {
      currentTarget: { value },
    } = event;
    dispatch({ type: "SET_CATEGORY_NAME", payload: value });
  };

  const onDescriptionChange = (
    event: React.SyntheticEvent<HTMLTextAreaElement>
  ) => {
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
            selectedEditCategory &&
            `${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${
              selectedEditCategory?.imageUrl
            }?v=${selectedEditCategory?.imageVersion || 0}`,
        },
        {
          categoryName,
          description,
          previewUrl,
        }
      )
    ) {
      openEditCategory(false);
      return;
    }

    showConfirm({
      title: CONFIRM_DIALOG_MESSAGE.DISCARD_INPUT.TITLE,
      message: CONFIRM_DIALOG_MESSAGE.DISCARD_INPUT.MESSAGE,
      confirmText: CONFIRM_DIALOG_MESSAGE.DISCARD_INPUT.CONFIRM_TEXT,
      cancelText: CONFIRM_DIALOG_MESSAGE.DISCARD_INPUT.CANCEL_TEXT,
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

  const onImageLoad = async (e: SyntheticEvent<HTMLImageElement, Event>) => {
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

  const onCropComplete = async (newCrop: Crop) => {
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

    if (file.size > 1024 * 512) {
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

  const handleCreateAiImage = async () => {
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

  const handleSave = async () => {
    let uploadParams: PutObjectCommandInput | null = null;
    let croppedImageBuffer = null;

    if (!restaurantInfo) {
      addToast(
        "error",
        "Error occurred while saving menu category. Please try again later"
      );
      return;
    }

    // If the image exists, upload the image to S3
    let imageKey = `menus/${restaurantInfo.id}/_category_${categoryName}.jpg`;
    if (croppedImage && croppedImage.size > 1024) {
      // If selectedEditCategory exists, use the existing image key
      if (selectedEditCategory) {
        if (selectedEditCategory.imageUrl) {
          imageKey = selectedEditCategory.imageUrl;
        }
      }

      try {
        const arrayBuffer = await croppedImage.arrayBuffer();
        croppedImageBuffer = Buffer.from(arrayBuffer);
      } catch (err) {
        addToast("error", "Error occurred while uploading menu category");
        return;
      }

      if (croppedImageBuffer.length <= 10) {
        addToast("error", "Error occurred while uploading menu category");
        return;
      }

      uploadParams = {
        Bucket: AWS_S3_YOSHI_BUCKET,
        Key: imageKey,
        Body: croppedImageBuffer,
        ContentType: croppedImage.type,
        CacheControl: AWS_S3_PUT_OBJECT_CACHE_CONTROL,
        ContentLength: croppedImage.size,
      };
    }

    // Create new category if not selectedEditCategory
    if (!selectedEditCategory) {
      const menuCategoryInfo: CreateMenuCategoryParams = {
        restaurantId: restaurantInfo.id,
        name: categoryName,
        description,
        imageUrl: imageKey,
        displayOrder: 0,
      };

      const newMenuCategory = await createCategory(
        {
          menuCategoryInfo,
          uploadParams,
        },
        {
          additionalKeys: restaurantInfo
            ? [RESTAURANT_ENDPOINT.MENU_CATEGORY(restaurantInfo.id)]
            : [],
        }
      );

      if (newMenuCategory) {
        openEditCategory(false);
        addToast("success", "Menu category created successfully!");
      }
    } else {
      // Update category if selectedEditCategory
      const menuCategoryInfo: UpdateMenuCategoryParams = {
        id: selectedEditCategory.id,
        name: categoryName,
        description,
        imageUrl: imageKey,
        imageVersion:
          selectedEditCategory.imageUrl && uploadParams !== null
            ? selectedEditCategory.imageVersion + 1
            : selectedEditCategory.imageVersion,
      };

      const updatedMenuCategory = await updateCategory(
        {
          menuCategoryInfo,
          uploadParams,
        },
        {
          additionalKeys: [
            RESTAURANT_ENDPOINT.MENU_CATEGORY(
              selectedEditCategory.restaurantId
            ),
          ],
        }
      );

      if (updatedMenuCategory) {
        openEditCategory(false);
        addToast("success", "Menu Category updated successfully!");
      }
    }
  };

  useEffect(() => {
    if (selectedEditCategory?.imageUrl) {
      const imageUrl = `${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${
        selectedEditCategory?.imageUrl
      }?v=${selectedEditCategory?.imageVersion || 0}`;
      dispatch({ type: "SET_PREVIEW_URL", payload: imageUrl });
    }
    if (selectedEditCategory?.name) {
      dispatch({
        type: "SET_CATEGORY_NAME",
        payload: selectedEditCategory.name,
      });
    }
    if (selectedEditCategory?.description) {
      dispatch({
        type: "SET_DESCRIPTION",
        payload: selectedEditCategory.description,
      });
    }
  }, [
    selectedEditCategory?.imageUrl,
    selectedEditCategory?.imageVersion,
    selectedEditCategory?.name,
    selectedEditCategory?.description,
  ]);

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
    if (restaurantInfoErr) {
      addToast("error", restaurantInfoErr.message);
    }
  }, [restaurantInfoErr]);

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
        createAiImageLoading ||
        restaurantInfoLoading) && <LoadingOverlay />}
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
            </div>
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
                      minWidth={CROP_MIN_WIDTH}
                      minHeight={CROP_MIN_HEIGHT}
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
                placeholder="Enter description"
              />
              <div
                className={`flex ${
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
                    onClick={handleSave}
                    disabled={categoryName.length <= 0 || isAiImageLoading}
                    className={`px-6 py-2 text-white transition duration-200  rounded ${
                      categoryName.length <= 0 || isAiImageLoading
                        ? "cursor-not-allowed bg-green-400"
                        : "bg-green-500 hover:bg-green-600"
                    }`}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
