import { Crop } from "react-image-crop";

export interface EditImageState {
  selectedFile: File | null;
  previewUrl: string | null;
  crop: Crop | undefined;
  isAiImageLoading: boolean;
  croppedImage: Blob | null;
  renderedDimension: { width: number; height: number };
  shouldProcessCrop: boolean;
}

export type EditImageAction =
  | { type: "SET_CROPPED_IMAGE"; payload: Blob }
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
    };

export type EditImageActionTypes = ActionTypes<EditImageAction>;
export const editImageAcitonTypes: EditImageActionTypes[] = [
  "SET_CROP",
  "SET_CROPPED_IMAGE",
  "SET_PREVIEW_URL",
  "SET_RENDERED_DIMENSION",
  "START_AI_IMAGE_CREATION",
  "END_AI_IMAGE_CREATION",
  "HANDLE_FILE_CHANGE",
  "ON_IMAGE_LOAD",
  "RESET_SHOULD_PROCESS_CROP",
];

export const initialImageState: EditImageState = {
  selectedFile: null,
  previewUrl: null,
  crop: undefined,
  isAiImageLoading: false,
  croppedImage: null,
  renderedDimension: { width: 0, height: 0 },
  shouldProcessCrop: false,
};

const editImageReducer = (
  state: EditImageState,
  action: EditImageAction
): EditImageState => {
  switch (action.type) {
    case "SET_CROPPED_IMAGE":
      return { ...state, croppedImage: action.payload };
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

export default editImageReducer;
