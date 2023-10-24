/* eslint-disable @next/next/no-img-element */
import { OWNER_ENDPOINT, RESTAURANT_MENU_ENDPOINT } from "@/constants/endpoint";
import { Method } from "@/constants/fetch";
import { CONFIRM_DIALOG_MESSAGE } from "@/constants/message/confirm";
import { AWS_S3_YOSHI_BUCKET } from "@/constants/service";
import {
  CreateMenuCategoryParams,
  IMenuCategory,
  UpdateMenuCategoryParams,
} from "@/database";
import { useConfirm } from "@/hooks/useConfirm";
import useDeepEffect from "@/hooks/useDeepEffect";
import { useToast } from "@/hooks/useToast";
import useMutation, { ApiErrorState } from "@/lib/client/useMutation";
import { ApiError } from "@/lib/shared/error/ApiError";
import {
  IPostOpenAiImageBody,
  IPostOpenAiImageResponse,
} from "@/pages/api/v1/owner/open-ai-images";
import {
  IDeleteMenuCategoryBody,
  IPatchMenuCategoryBody,
  IPostMenuCategoryBody,
} from "@/pages/api/v1/owner/restaurants/[restaurantId]/menus/categories";
import {
  selectedEditCategoryState,
  showCategoryEditState,
} from "@/recoil/state/menuState";
import menuCategoryEditReducer, {
  initialEditCategoryState,
} from "@/reducers/menu/menuCategoryEditReducer";
import getCloudImageUrl from "@/utils/menu/getCloudImageUrl";
import getS3UploadParams from "@/utils/menu/getS3UploadParams";
import setDefaultMenuOptions from "@/utils/menu/setDefaultMenuOptions";
import validateMenuOptions, {
  MenuOptionForm,
} from "@/utils/menu/validateMenuOptions";
import isArrayOfObjectsChanged from "@/utils/validation/isArrayOfObjectsChanged";
import isCropped from "@/utils/validation/isCropped";
import isEmpty from "@/utils/validation/isEmpty";
import isFormChanged from "@/utils/validation/isFormChanged";
import isImageChanged from "@/utils/validation/isImageChanged";
import {
  DeleteObjectCommandInput,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { MenuCategory, MenuCategoryStatus } from "@prisma/client";
import { useEffect, useReducer, useRef } from "react";
import "react-image-crop/dist/ReactCrop.css";
import { useRecoilState } from "recoil";
import LoadingOverlay from "../LoadingOverlay";
import EditBottomSheet from "./EditBottomSheet";
import EditBottomSheetFooter from "./EditBottomSheetFooter";
import ImageEdit from "./ImageEdit";
import OptionsEdit from "./OptionsEdit";

type MenuCategoryEditProps = {
  restaurantId: string | undefined | null;
};

export default function CategoryEdit({ restaurantId }: MenuCategoryEditProps) {
  // ==========================
  // useMutation
  // ==========================
  const [
    createCategory,
    { error: createCategoryErr, loading: createCategoryLoading },
  ] = useMutation<MenuCategory, IPostMenuCategoryBody>(
    restaurantId
      ? OWNER_ENDPOINT.RESTAURANT.MENU.CATEGORY.BASE(restaurantId)
      : null,
    Method.POST
  );
  const [
    updateCategory,
    { error: updateCategoryErr, loading: updateCategoryLoading },
  ] = useMutation<MenuCategory, IPatchMenuCategoryBody>(
    restaurantId
      ? OWNER_ENDPOINT.RESTAURANT.MENU.CATEGORY.BASE(restaurantId)
      : null,
    Method.PATCH
  );
  const [
    deleteCategory,
    { error: deleteCategoryErr, loading: deleteCategoryLoading },
  ] = useMutation<MenuCategory, IDeleteMenuCategoryBody>(
    restaurantId
      ? OWNER_ENDPOINT.RESTAURANT.MENU.CATEGORY.BASE(restaurantId)
      : null,
    Method.DELETE
  );
  const [
    createAiImage,
    { error: createAiImageErr, loading: createAiImageLoading },
  ] = useMutation<IPostOpenAiImageResponse, IPostOpenAiImageBody>(
    OWNER_ENDPOINT.OPEN_AI_IMAGE,
    Method.POST
  );

  // ==========================
  // Recoil State
  // ==========================
  const [isVisible, openEditCategory] = useRecoilState(showCategoryEditState);
  const [selectedEditCategory, setSelectedEditCategory] = useRecoilState(
    selectedEditCategoryState
  );

  // ==========================
  // Custom hooks
  // ==========================
  const { addToast } = useToast();
  const { showConfirm } = useConfirm();

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

  // 「Save」 ボタンの活性条件
  const isSaveBtnDisabled =
    categoryName.length <= 0 ||
    isAiImageLoading ||
    options.some((option) => option.error);

  // メニューカテゴリを削除する
  const handleDeleteCategory = (selectedCategory: IMenuCategory | null) => {
    if (!selectedCategory || isEmpty(selectedCategory)) {
      addToast(
        "error",
        "Error occurred while deleting menu category. Please try again later"
      );
      return;
    }

    // 確認ダイアログの表示
    showConfirm({
      title: CONFIRM_DIALOG_MESSAGE.DELETE_CATEGORY.TITLE,
      message: CONFIRM_DIALOG_MESSAGE.DELETE_CATEGORY.MESSAGE,
      confirmText: CONFIRM_DIALOG_MESSAGE.DELETE_CATEGORY.CONFIRM_TEXT,
      cancelText: CONFIRM_DIALOG_MESSAGE.DELETE_CATEGORY.CANCEL_TEXT,
      buttonType: "fatal",
      onConfirm: async () => {
        let deleteParams: DeleteObjectCommandInput | null = null;
        // 画像が存在する場合、S3の削除パラメータを設定
        if (selectedCategory.imageUrl) {
          deleteParams = {
            Bucket: AWS_S3_YOSHI_BUCKET,
            Key: selectedCategory.imageUrl,
          };
        }

        const params = {
          menuCategoryId: selectedCategory.id,
          deleteParams,
        };

        // メニューカテゴリの削除
        const deletedMenuCategory = await deleteCategory(params, {
          additionalKeys: [
            RESTAURANT_MENU_ENDPOINT.CATEGORY(selectedCategory.restaurantId),
          ],
        });

        // 削除に成功した場合、コンテナを閉じ、成功メッセージを表示する
        if (deletedMenuCategory) {
          openEditCategory(false);
          addToast("success", "Menu category deleted successfully!");
        }
      },
    });
  };

  // メニューカテゴリ編集コンテナを閉じる
  const handleCloseCategory = (selectedCategory: IMenuCategory | null) => {
    // 編集前のメニュー情報
    const beforeChange = {
      categoryName: selectedCategory?.name ?? "",
      description: selectedCategory?.description ?? "",
      previewUrl:
        selectedCategory?.imageUrl &&
        getCloudImageUrl(
          selectedCategory.imageUrl,
          selectedCategory.imageVersion
        ),
      menuCategoryStatus:
        selectedCategory?.status ?? MenuCategoryStatus.AVAILABLE,
    };

    // 画面のメニューカテゴリの情報
    const menuCategoryState = {
      categoryName,
      description,
      previewUrl,
      menuCategoryStatus,
    };

    // 画面情報が変更されていない場合、メニュー編集コンテナを閉じる
    if (
      !isFormChanged(beforeChange, menuCategoryState) &&
      !isArrayOfObjectsChanged(previousOptions, options)
    ) {
      openEditCategory(false);
      return;
    }

    // 情報破棄の確認ダイアログの表示
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

  // 新たにメニューカテゴリを作成する
  const handleCreate = async (
    menuCategoryParams: CreateMenuCategoryParams,
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

    const params = {
      menuCategoryParams,
      menuCategoryOptions,
      uploadParams,
    };

    // メニューカテゴリの作成
    const newMenuCategory = await createCategory(params, {
      additionalKeys: [RESTAURANT_MENU_ENDPOINT.CATEGORY(restaurantId)],
    });

    // メニューカテゴリの作成に成功した場合
    if (newMenuCategory) {
      openEditCategory(false);
      addToast("success", "Menu category created successfully!");
    }
  };

  // メニューカテゴリを更新する
  const handleUpdate = async (
    menuCategoryParams: UpdateMenuCategoryParams,
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

    const params = {
      menuCategoryParams,
      menuCategoryOptions,
      uploadParams,
    };

    // メニューカテゴリの更新
    const updatedMenuCategory = await updateCategory(params, {
      additionalKeys: [RESTAURANT_MENU_ENDPOINT.CATEGORY(restaurantId)],
    });

    // メニューカテゴリの更新に成功した場合、コンテナを閉じ、成功メッセージを表示する
    if (updatedMenuCategory) {
      openEditCategory(false);
      addToast("success", "Menu Category updated successfully!");
    }
  };

  // 画像修正の判定
  const shouldUploadImage = (
    selectedCategory: IMenuCategory | null | undefined
  ): boolean => {
    if (!selectedCategory?.imageUrl) {
      return true;
    }

    return (
      isImageChanged(previewUrl, selectedCategory.imageUrl) ||
      isCropped(renderedDimension, crop)
    );
  };

  // メニューカテゴリ情報を保存する
  const handleSave = async (
    selectedCategory: IMenuCategory | null
  ): Promise<void> => {
    if (!restaurantId) {
      addToast(
        "error",
        "Error occurred while saving menu category. Please try again later"
      );
      return;
    }

    // メニューカテゴリのオプションが存在する場合、有効チェックを行う
    if (!isEmpty(options)) {
      const validatedOptions = validateMenuOptions(options);
      // エラーが存在する場合、エラーを表示し、処理を終了する
      if (validatedOptions.some((option) => option.error)) {
        dispatch({ type: "SET_OPTIONS", payload: validatedOptions });
        return;
      }
    }

    // S3のimageKeyを設定する
    const imageKey =
      selectedCategory?.imageUrl ||
      `menus/${restaurantId}/_category_${categoryName}.jpg`;

    // S3に画像をアップロードする
    // 画像が修正されていない場合 又は 画像がない場合、アップロードを行わない
    const uploadParams = await getS3UploadParams(croppedImage, imageKey, () =>
      shouldUploadImage(selectedCategory)
    );

    // S3のアップロードに失敗した場合、エラーを表示し、処理を終了する
    if (uploadParams instanceof ApiError) {
      addToast("error", uploadParams.message);
      return;
    }

    const { id, imageUrl, imageVersion } = selectedCategory || {};

    // 画像のURLを設定。画像のURLが存在する場合、S3のimageKeyを設定
    const imageUrlValue = uploadParams ? imageKey : imageUrl || "";
    // 画像のバージョンを設定。画像のバージョンが存在する場合、バージョンを+1する
    const imageVersionValue =
      imageUrl && uploadParams ? (imageVersion ?? 0) + 1 : imageVersion;

    const menuCategoryParams:
      | CreateMenuCategoryParams
      | UpdateMenuCategoryParams = {
      id: selectedCategory?.id,
      restaurantId,
      name: categoryName,
      description,
      status: menuCategoryStatus,
      imageUrl: imageUrlValue,
      imageVersion: imageVersionValue,
    };

    if (selectedCategory) {
      // メニュー情報が存在する場合、メニューカテゴリを更新する
      await handleUpdate(menuCategoryParams, options, uploadParams);
    } else {
      // メニュー情報が存在する場合、メニューカテゴリを更新する
      await handleCreate(menuCategoryParams, options, uploadParams);
    }
  };

  const handleErrors = (error: ApiErrorState | null | undefined) => {
    if (error) {
      addToast("error", error.message);
    }
  };

  useEffect(() => {
    const { imageUrl, imageVersion, name, description, status } =
      selectedEditCategory || {};

    if (imageUrl) {
      const previewUrl = getCloudImageUrl(imageUrl, imageVersion);
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
  }, [selectedEditCategory]);

  // オプションの最大数を10に制限
  useEffect(() => {
    if (optionCount > 10) {
      addToast("error", "The maximum number of options is 10");
      dispatch({ type: "SUBTRACT_OPTIONS" });
    }
  }, [optionCount]);

  // オプションの初期化
  useDeepEffect(() => {
    if (selectedEditCategory && !isEmpty(selectedEditCategory.defaultOptions)) {
      setDefaultMenuOptions(
        selectedEditCategory.defaultOptions,
        dispatch,
        ({ id, name, price }) => ({ id, name, price })
      );
    }
  }, [selectedEditCategory?.defaultOptions]);

  // 各useMutationでエラーが発生した場合、エラーを表示する
  useEffect(() => {
    handleErrors(createCategoryErr);
    handleErrors(updateCategoryErr);
    handleErrors(deleteCategoryErr);
    handleErrors(createAiImageErr);
  }, [
    createCategoryErr,
    updateCategoryErr,
    deleteCategoryErr,
    createAiImageErr,
  ]);

  // メニューカテゴリ編集コンテナを閉じる場合、メニュー情報を初期化する
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
      {/* Canvas (Tempotary painting) */}
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
      {/* CategoryEdit Container */}
      <EditBottomSheet
        isVisible={isVisible}
        handleCloseEdit={() => handleCloseCategory(selectedEditCategory)}
        activeTab={activeTab}
        dispatch={dispatch}
        essentialCondition={categoryName.length <= 0}
        optionalCondition={options.some((option) => option.error)}
      >
        {/* Essential */}
        {activeTab === "essential" && (
          <div className="relative flex flex-col space-y-4">
            {/* Menu Category Name */}
            <input
              onChange={(e) =>
                dispatch({
                  type: "SET_CATEGORY_NAME",
                  payload: e.target.value,
                })
              }
              className={`p-2 border-b-2 w-full`}
              type="text"
              value={categoryName}
              placeholder="Enter category name (example: Lunch)"
            />
            {/* Menu Category Name Error */}
            <span className="absolute text-sm text-red-500 right-5 -top-2">
              {categoryName.length <= 0 && "※ Category name is required"}
            </span>
            {/* Menu Category Image */}
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
          </div>
        )}
        {/* Optional */}
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
        {/* Footer */}
        <EditBottomSheetFooter
          previousData={selectedEditCategory}
          handleSave={() => handleSave(selectedEditCategory)}
          handleDelete={() => handleDeleteCategory(selectedEditCategory)}
          handleCloseEdit={() => handleCloseCategory(selectedEditCategory)}
          deleteCondition={isAiImageLoading}
          saveCondition={isSaveBtnDisabled}
        />
      </EditBottomSheet>
    </form>
  );
}
