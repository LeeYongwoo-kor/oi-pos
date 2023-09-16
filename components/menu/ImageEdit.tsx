/* eslint-disable @next/next/no-img-element */
import {
  PICTURE_CROP_MIN_HEIGHT,
  PICTURE_CROP_MIN_WIDTH,
  PICTURE_DRAW_IMAGE_TYPE,
  PICTURE_MAX_CAPACITY,
} from "@/constants/menu";
import { useToast } from "@/hooks/useToast";
import { UseMutationOptions } from "@/lib/client/useMutation";
import {
  IPostOpenAiImageBody,
  IPostOpenAiImageResponse,
} from "@/pages/api/v1/open-ai-images";
import { EditImageAction } from "@/reducers/menu/editImageReducer";
import generateNextImageURL from "@/utils/generateNextImageURL";
import isEmpty from "@/utils/validation/isEmpty";
import { RefObject, SyntheticEvent, useEffect, useRef } from "react";
import ReactCrop, { Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface CanvasRefInfo {
  canvasRef: RefObject<HTMLCanvasElement>;
  cropCanvasRef: RefObject<HTMLCanvasElement>;
}

interface MenuImageInfo {
  triggerName: string;
  previewUrl: string | null;
  renderedDimension: { width: number; height: number };
  isAiImageLoading: boolean;
  crop: Crop | undefined;
  shouldProcessCrop: boolean;
}

type ImageEditProps = {
  createAiImage: (
    data: IPostOpenAiImageBody,
    options?: UseMutationOptions | undefined
  ) => Promise<IPostOpenAiImageResponse>;
  canvasInfo: CanvasRefInfo;
  imageInfo: MenuImageInfo;
  dispatch: React.Dispatch<EditImageAction>;
};

export default function ImageEdit({
  createAiImage,
  imageInfo: {
    triggerName,
    previewUrl,
    isAiImageLoading,
    renderedDimension,
    crop,
    shouldProcessCrop,
  },
  canvasInfo: { canvasRef, cropCanvasRef },
  dispatch,
}: ImageEditProps) {
  const { addToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

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
        }, PICTURE_DRAW_IMAGE_TYPE);
      });
    } catch (err) {
      // Send error to sentry
      console.error(err);
      return new Blob();
    }
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
    if (!triggerName) {
      addToast("error", "Please enter a name for the AI Image");
      return;
    }

    try {
      dispatch({ type: "START_AI_IMAGE_CREATION" });
      const result = await createAiImage({ triggerName });
      if (result && result.data.length > 0) {
        dispatch({ type: "SET_PREVIEW_URL", payload: result.data[0].url });
        await paintCanvas(result.data[0].url);
      }
    } finally {
      dispatch({ type: "END_AI_IMAGE_CREATION" });
    }
  };

  useEffect(() => {
    const handleCropComplete = async () => {
      if (crop && shouldProcessCrop) {
        await onCropComplete(crop);
        dispatch({ type: "RESET_SHOULD_PROCESS_CROP" });
      }
    };
    handleCropComplete();
  }, [shouldProcessCrop]);

  return (
    <>
      <div className="flex flex-col items-center p-2 border-2 rounded">
        <label className="hidden">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload an image"
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
            disabled={triggerName.length <= 0 || isAiImageLoading}
            className={`w-full py-2 mt-2 text-white transition rounded ${
              triggerName.length <= 0 || isAiImageLoading
                ? "cursor-not-allowed bg-lime-400"
                : "bg-lime-500 hover:bg-lime-600"
            }`}
          >
            Generate Image with AI
          </button>
        </div>
      </div>
    </>
  );
}
