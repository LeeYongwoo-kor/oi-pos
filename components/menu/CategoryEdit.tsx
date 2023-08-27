/* eslint-disable @next/next/no-img-element */
import {
  OPEN_AI_IMAGE_ENDPOINT,
  RESTAURANT_ENDPOINT,
} from "@/constants/endpoint";
import { Method } from "@/constants/fetch";
import { CROP_MIN_HEIGHT, CROP_MIN_WIDTH } from "@/constants/menu";
import { useToast } from "@/hooks/useToast";
import useMutation from "@/lib/client/useMutation";
import {
  AWS_S3_PUT_OBJECT_CACHE_CONTROL,
  AWS_S3_YOSHI_BUCKET,
} from "@/lib/services/aws-s3";
import {
  IPostOpenAiImageBody,
  IPostOpenAiImageResponse,
} from "@/pages/api/v1/open-ai-images";
import { IPostMenuCategoryBody } from "@/pages/api/v1/restaurants/[restaurantId]/menu-categories";
import {
  selectedEditCategoryState,
  showCategoryEditState,
} from "@/recoil/state/menuState";
import generateNextImageURL from "@/utils/generateNextImageURL";
import isEmpty from "@/utils/validation/isEmpty";
import { PutObjectCommandInput } from "@aws-sdk/client-s3";
import { SyntheticEvent, useEffect, useRef, useState } from "react";
import ReactCrop, { Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useRecoilState, useRecoilValue } from "recoil";
import LoadingOverlay from "../LoadingOverlay";
import { useForm } from "react-hook-form";
import isFormChanged from "@/utils/validation/isFormChanged";
import { useConfirm } from "@/hooks/useConfirm";
import { CONFIRM_DIALOG_MESSAGE } from "@/constants/message/confirm";
import { UpsertMenuCategoryParams } from "@/database";

export default function CategoryEdit() {
  const [isVisible, closeEditCategory] = useRecoilState(showCategoryEditState);
  const selectedEditCategory = useRecoilValue(selectedEditCategoryState);
  const [
    createCategory,
    { error: createCategoryErr, loading: createCategoryLoading },
  ] = useMutation<{ success: boolean }, IPostMenuCategoryBody>(
    RESTAURANT_ENDPOINT.MENU_CATEGORY(
      selectedEditCategory ? selectedEditCategory.restaurantId : ""
    ),
    Method.POST
  );
  const [
    createAiImage,
    { error: createAiImageErr, loading: createAiImageLoading },
  ] = useMutation<IPostOpenAiImageResponse, IPostOpenAiImageBody>(
    OPEN_AI_IMAGE_ENDPOINT.BASE,
    Method.POST
  );
  const { addToast } = useToast();
  const { showConfirm } = useConfirm();

  console.log("selectedEditCategory", selectedEditCategory);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [isAiImageLoading, setIsAiImageLoading] = useState(false);
  const [croppedImage, setCroppedImage] = useState<Blob | null>(null);
  const [renderedDimension, setRenderedDimension] = useState({
    width: 0,
    height: 0,
  });

  const onCategoryNameChange = (
    event: React.SyntheticEvent<HTMLInputElement>
  ) => {
    const {
      currentTarget: { value },
    } = event;
    setCategoryName(value);
  };

  const onDescriptionChange = (
    event: React.SyntheticEvent<HTMLTextAreaElement>
  ) => {
    const {
      currentTarget: { value },
    } = event;
    setDescription(value);
  };

  const handleDeleteCategory = () => {};

  const handleCloseCategory = () => {
    if (!selectedEditCategory) {
      closeEditCategory(false);
      return;
    }

    if (
      !isFormChanged(
        {
          categoryName: selectedEditCategory.name,
          description: selectedEditCategory.description,
        },
        {
          categoryName,
          description,
        }
      )
    ) {
      closeEditCategory(false);
      return;
    }

    showConfirm({
      title: CONFIRM_DIALOG_MESSAGE.DELETE_INFO.TITLE,
      message: CONFIRM_DIALOG_MESSAGE.DELETE_INFO.MESSAGE,
      confirmText: CONFIRM_DIALOG_MESSAGE.DELETE_INFO.CONFIRM_TEXT,
      cancelText: CONFIRM_DIALOG_MESSAGE.DELETE_INFO.CANCEL_TEXT,
      onConfirm: () => {
        closeEditCategory(false);
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

  const getCroppedImg = async (imageSrc: string, crop: Crop): Promise<Blob> => {
    try {
      if (!crop || isEmpty(crop)) {
        return new Blob();
      }

      const containerWidth = imageContainerRef.current?.clientWidth || 0;
      const containerHeight = imageContainerRef.current?.clientHeight || 0;

      // Paint the image into canvas
      await paintCanvas(imageSrc);
      const canvas = canvasRef.current;
      if (!canvas) return new Blob();

      // Calculate the actual pixel values based on percentCrop and rendered dimensions
      const { x, y, width, height } = crop;
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
    setRenderedDimension({ width, height });

    const x = (containerWidth - width) / 2;
    const y = (containerHeight - height) / 2;

    setCrop({
      unit: "px",
      x,
      y,
      width,
      height,
    });

    await paintCanvas(e.currentTarget.src);
  };

  const onCropComplete = async (crop: Crop) => {
    if (!previewUrl) {
      return;
    }

    const croppedImgBlob = await getCroppedImg(previewUrl, crop);
    if (croppedImgBlob.size <= 0) {
      addToast("error", "Error occurred while loading image");
      return;
    }
    setCroppedImage(croppedImgBlob);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);

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
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateAiImage = async () => {
    setIsAiImageLoading(true);
    const result = await createAiImage({ categoryName });
    if (result && result.data.length > 0) {
      setPreviewUrl(result.data[0].url);
      await paintCanvas(result.data[0].url);
    }
    setIsAiImageLoading(false);
  };

  const handleSave = async () => {
    if (!croppedImage || croppedImage.size <= 0 || !selectedFile) {
      addToast("info", "Please select a file before uploading");
      return;
    }

    let croppedImageBuffer = null;
    try {
      const arrayBuffer = await croppedImage.arrayBuffer();
      croppedImageBuffer = Buffer.from(arrayBuffer);
    } catch (err) {
      addToast("error", "Error occurred while uploading image");
      return;
    }

    if (croppedImageBuffer.length <= 0) {
      addToast("error", "Error occurred while uploading image");
      return;
    }

    const restaurantId = selectedEditCategory?.restaurantId;
    const name = selectedEditCategory?.name;

    const uploadParams: PutObjectCommandInput = {
      Bucket: AWS_S3_YOSHI_BUCKET,
      Key: `menus/${restaurantId}/_category_${name}.jpg`,
      Body: croppedImageBuffer,
      ContentType: croppedImage.type,
      CacheControl: AWS_S3_PUT_OBJECT_CACHE_CONTROL,
      ContentLength: croppedImage.size,
    };

    const menuCategoryInfo: UpsertMenuCategoryParams = {
      id: selectedEditCategory?.id,
      restaurantId: restaurantId || "",
      name: categoryName,
      description: description,
      imageUrl: `menus/${restaurantId}/_category_${name}.jpg`,
      imageVersion: selectedEditCategory?.imageVersion,
    };

    const result = await createCategory(
      { menuCategoryInfo, uploadParams },
      { isMutate: false }
    );
    if (result) {
      closeEditCategory(false);
      addToast("success", "File uploaded successfully!");
    }
  };

  useEffect(() => {
    if (selectedEditCategory?.imageUrl) {
      const imageUrl = `${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${
        selectedEditCategory?.imageUrl
      }?v=${selectedEditCategory?.imageVersion || 0}`;
      setPreviewUrl(imageUrl);
    }
    if (selectedEditCategory?.name) {
      setCategoryName(selectedEditCategory.name);
    }
    if (selectedEditCategory?.description) {
      setDescription(selectedEditCategory.description);
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
    if (createAiImageErr) {
      addToast("error", createAiImageErr.message);
    }
  }, [createAiImageErr]);

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      {(createCategoryLoading || createAiImageLoading) && <LoadingOverlay />}
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
                className="absolute p-2 text-sm text-black bg-gray-200 border-4 border-white rounded-full hover:bg-gray-300"
              >
                Back
              </button>
            </div>
            <div className="flex flex-col space-y-4">
              <input
                onChange={onCategoryNameChange}
                className={`p-2 border-b-2 w-full`}
                type="text"
                value={categoryName}
                placeholder="Enter category name (example: Lunch)"
              />
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
                      onChange={(newCrop) => setCrop(newCrop)}
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
                    disabled={categoryName.length <= 0 || isAiImageLoading}
                    onClick={handleCreateAiImage}
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
              <div className="flex justify-between">
                <button
                  onClick={handleDeleteCategory}
                  className="px-6 py-2 text-white transition duration-200 bg-red-500 rounded hover:bg-red-600"
                >
                  Delete
                </button>
                <div className="space-x-2">
                  <button
                    onClick={handleCloseCategory}
                    className="px-6 py-2 text-black transition duration-200 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 text-white transition duration-200 bg-green-500 rounded hover:bg-green-600"
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
