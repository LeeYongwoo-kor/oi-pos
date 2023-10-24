/* eslint-disable @next/next/no-img-element */
import { OWNER_ENDPOINT, RESTAURANT_MENU_ENDPOINT } from "@/constants/endpoint";
import { Method } from "@/constants/fetch";
import { SUB_CATEGORY_VALUE_NONE } from "@/constants/menu";
import { CONFIRM_DIALOG_MESSAGE } from "@/constants/message/confirm";
import { AWS_S3_YOSHI_BUCKET } from "@/constants/service";
import {
  CreateMenuItemParams,
  IMenuCategory,
  IMenuItem,
  UpdateMenuItemParams,
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
  IDeleteMenuItemBody,
  IPatchMenuItemBody,
  IPostMenuItemBody,
} from "@/pages/api/v1/owner/restaurants/[restaurantId]/menus/items";
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
import getCloudImageUrl from "@/utils/menu/getCloudImageUrl";
import getS3UploadParams from "@/utils/menu/getS3UploadParams";
import setDefaultMenuOptions from "@/utils/menu/setDefaultMenuOptions";
import validateMenuOptions, {
  MenuItemOptionForm,
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
import { MenuItem, MenuItemStatus } from "@prisma/client";
import { useEffect, useReducer, useRef } from "react";
import "react-image-crop/dist/ReactCrop.css";
import { useRecoilState, useRecoilValue } from "recoil";
import LoadingOverlay from "../LoadingOverlay";
import EditBottomSheet from "./EditBottomSheet";
import EditBottomSheetFooter from "./EditBottomSheetFooter";
import ImageEdit from "./ImageEdit";
import OptionsEdit from "./OptionsEdit";

type MenuCategoryEditProps = {
  restaurantId: string | undefined | null;
};

export default function MenuEdit({ restaurantId }: MenuCategoryEditProps) {
  // ==========================
  // useMutation
  // ==========================
  const [
    createMenuItem,
    { error: createMenuItemErr, loading: createMenuItemLoading },
  ] = useMutation<MenuItem, IPostMenuItemBody>(
    restaurantId ? OWNER_ENDPOINT.RESTAURANT.MENU.ITEM(restaurantId) : null,
    Method.POST
  );
  const [
    updateMenuItem,
    { error: updateMenuItemErr, loading: updateMenuItemLoading },
  ] = useMutation<MenuItem, IPatchMenuItemBody>(
    restaurantId ? OWNER_ENDPOINT.RESTAURANT.MENU.ITEM(restaurantId) : null,
    Method.PATCH
  );
  const [
    deleteMenuItem,
    { error: deleteMenuItemErr, loading: deleteMenuItemLoading },
  ] = useMutation<MenuItem, IDeleteMenuItemBody>(
    restaurantId ? OWNER_ENDPOINT.RESTAURANT.MENU.ITEM(restaurantId) : null,
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
  const [isVisible, openEditMenu] = useRecoilState(showMenuEditState);
  const isMobile = useRecoilValue(mobileState);
  const selectedCategory = useRecoilValue(selectedCategoryState);
  const [selectedEditMenu, setSelectedEditMenu] = useRecoilState(
    selectedEditMenuState
  );
  const selectedSubCategories = useRecoilValue(selectedSubCategoryState);

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

  // サブカテゴリの取得
  const selectedSubCategory = selectedCategory
    ? selectedSubCategories[selectedCategory.id]
    : null;

  // 「Save」 ボタンの活性条件
  const isSaveBtnDisabled =
    menuName.length <= 0 ||
    price <= 0 ||
    isAiImageLoading ||
    options.some((option) => option.error);

  // メニューを削除する
  const handleDeleteMenuItem = (selectedMenu: IMenuItem | null) => {
    if (!selectedMenu || isEmpty(selectedMenu) || !restaurantId) {
      addToast(
        "error",
        "Error occurred while deleting menu item. Please try again later"
      );
      return;
    }

    // 確認ダイアログの表示
    showConfirm({
      title: CONFIRM_DIALOG_MESSAGE.DELETE_MENU.TITLE,
      message: CONFIRM_DIALOG_MESSAGE.DELETE_MENU.MESSAGE,
      confirmText: CONFIRM_DIALOG_MESSAGE.DELETE_MENU.CONFIRM_TEXT,
      cancelText: CONFIRM_DIALOG_MESSAGE.DELETE_MENU.CANCEL_TEXT,
      buttonType: "fatal",
      onConfirm: async () => {
        let deleteParams: DeleteObjectCommandInput | null = null;
        // 画像が存在する場合、S3の削除パラメータを設定
        if (selectedMenu.imageUrl) {
          deleteParams = {
            Bucket: AWS_S3_YOSHI_BUCKET,
            Key: selectedMenu.imageUrl,
          };
        }

        const params = {
          menuItemId: selectedMenu.id,
          deleteParams,
        };

        // メニューの削除
        const deletedMenuCategory = await deleteMenuItem(params, {
          additionalKeys: [RESTAURANT_MENU_ENDPOINT.CATEGORY(restaurantId)],
        });

        // 削除に成功した場合、コンテナを閉じ、成功メッセージを表示する
        if (deletedMenuCategory) {
          openEditMenu(false);
          addToast("success", "Menu item deleted successfully!");
        }
      },
    });
  };

  // メニュー編集コンテナを閉じる
  const handleCloseMenuEdit = (selectedMenu: MenuItem | null) => {
    // 編集前のメニュー情報
    const beforeChange = {
      menuName: selectedMenu?.name ?? "",
      price: selectedMenu?.price ?? 0,
      description: selectedMenu?.description ?? "",
      previewUrl: selectedMenu?.imageUrl
        ? getCloudImageUrl(selectedMenu.imageUrl, selectedMenu.imageVersion)
        : null,
      menuItemStatus: selectedMenu?.status ?? MenuItemStatus.AVAILABLE,
    };

    // 画面のメニュー情報
    const menuState = {
      menuName,
      price,
      description,
      previewUrl,
      menuItemStatus,
    };

    // 画面情報が変更されていない場合、メニュー編集コンテナを閉じる
    if (
      !isFormChanged(beforeChange, menuState) &&
      !isArrayOfObjectsChanged(previousOptions, options)
    ) {
      openEditMenu(false);
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
        openEditMenu(false);
      },
    });
  };

  // 新たにメニューを作成する
  const handleCreate = async (
    menuItemParams: CreateMenuItemParams,
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

    const params = {
      menuItemParams,
      menuItemOptions,
      uploadParams,
    };

    // メニューの作成
    const newMenuItem = await createMenuItem(params, {
      additionalKeys: [RESTAURANT_MENU_ENDPOINT.CATEGORY(restaurantId)],
    });

    // メニューの作成に成功した場合
    if (newMenuItem) {
      openEditMenu(false);
      addToast("success", "Menu Item created successfully!");
    }
  };

  // メニューを更新する
  const handleUpdate = async (
    menuItemParams: UpdateMenuItemParams,
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

    const params = {
      menuItemParams,
      menuItemOptions,
      uploadParams,
    };

    // メニューの更新
    const updatedMenuItem = await updateMenuItem(params, {
      additionalKeys: [RESTAURANT_MENU_ENDPOINT.CATEGORY(restaurantId)],
    });

    // メニューの更新に成功した場合、コンテナを閉じ、成功メッセージを表示する
    if (updatedMenuItem) {
      openEditMenu(false);
      addToast("success", "Menu Item updated successfully!");
    }
  };

  // 画像修正の判定
  const shouldUploadImage = (
    selectedMenu: IMenuItem | null | undefined
  ): boolean => {
    if (!selectedMenu?.imageUrl) {
      return true;
    }

    return (
      isImageChanged(previewUrl, selectedMenu.imageUrl) ||
      isCropped(renderedDimension, crop)
    );
  };

  // メニュー情報を保存する
  const handleSave = async (
    selectedMenu: IMenuItem | null,
    selectedCategory: IMenuCategory | null
  ): Promise<void> => {
    if (!restaurantId || !selectedCategory) {
      addToast(
        "error",
        "Error occurred while saving menu item. Please try again later"
      );
      return;
    }

    // メニューのオプションが存在する場合、有効チェックを行う
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
      selectedMenu?.imageUrl ||
      `menus/${restaurantId}/${selectedCategory.name}/${menuName}.jpg`;

    // S3に画像をアップロードする
    // 画像が修正されていない場合 又は 画像がない場合、アップロードを行わない
    const uploadParams = await getS3UploadParams(croppedImage, imageKey, () =>
      shouldUploadImage(selectedMenu)
    );

    // S3のアップロードに失敗した場合、エラーを表示し、処理を終了する
    if (uploadParams instanceof ApiError) {
      addToast("error", uploadParams.message);
      return;
    }

    const { id, imageUrl, imageVersion } = selectedMenu || {};
    const { id: categoryId } = selectedCategory || {};

    // サブカテゴリが存在する場合、サブカテゴリのIDを設定
    const subCategoryId =
      subCategory !== SUB_CATEGORY_VALUE_NONE ? subCategory : undefined;
    // メニューのステータスが「限定」の場合、最大注文数を設定
    const maxDailyOrdersValue =
      menuItemStatus === MenuItemStatus.LIMITED ? maxDailyOrders : undefined;
    // 画像のURLを設定。画像のURLが存在する場合、S3のimageKeyを設定
    const imageUrlValue = uploadParams ? imageKey : imageUrl || "";
    // 画像のバージョンを設定。画像のバージョンが存在する場合、バージョンを+1する
    const imageVersionValue =
      imageUrl && uploadParams ? (imageVersion ?? 0) + 1 : imageVersion;

    const menuItemParams: CreateMenuItemParams | UpdateMenuItemParams = {
      id,
      categoryId,
      subCategoryId,
      name: menuName,
      price,
      description,
      status: menuItemStatus,
      maxDailyOrders: maxDailyOrdersValue,
      imageUrl: imageUrlValue,
      imageVersion: imageVersionValue,
    };

    if (selectedMenu) {
      // メニュー情報が存在する場合、メニューを更新する
      await handleUpdate(menuItemParams, options, uploadParams);
    } else {
      // メニュー情報が存在しない場合、メニューを作成する
      await handleCreate(menuItemParams, options, uploadParams);
    }
  };

  const handleErrors = (error: ApiErrorState | null | undefined) => {
    if (error) {
      addToast("error", error.message);
    }
  };

  // 各必須項目の初期化
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
      const previewUrl = getCloudImageUrl(imageUrl, imageVersion);
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
      // メニュー情報のサブカテゴリが存在する場合、サブカテゴリのIDを設定
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
  }, [selectedEditMenu, selectedSubCategory?.id]);

  // オプションの最大数を10に制限
  useEffect(() => {
    if (optionCount > 10) {
      addToast("error", "The maximum number of options is 10");
      dispatch({ type: "SUBTRACT_OPTIONS" });
    }
  }, [optionCount]);

  // オプションの初期化
  useDeepEffect(() => {
    if (isVisible) {
      // メニューのオプションが存在する場合、メニューのオプション値を設定（優先）
      if (selectedEditMenu && !isEmpty(selectedEditMenu?.menuItemOptions)) {
        setDefaultMenuOptions(
          selectedEditMenu.menuItemOptions,
          dispatch,
          ({ id, name, price }) => ({ id, name, price })
        );
        return;
      }

      // カテゴリのオプションが存在する場合、カテゴリのオプション値を設定
      if (selectedCategory && !isEmpty(selectedCategory.defaultOptions)) {
        setDefaultMenuOptions(
          selectedCategory.defaultOptions,
          dispatch,
          ({ id, name, price }) => ({ categoryOptionId: id, name, price })
        );
      }
    }
  }, [
    selectedCategory?.defaultOptions,
    selectedEditMenu?.menuItemOptions,
    isVisible,
  ]);

  // 各useMutationでエラーが発生した場合、エラーを表示する
  useEffect(() => {
    handleErrors(createMenuItemErr);
    handleErrors(updateMenuItemErr);
    handleErrors(deleteMenuItemErr);
    handleErrors(createAiImageErr);
  }, [
    createMenuItemErr,
    updateMenuItemErr,
    deleteMenuItemErr,
    createAiImageErr,
  ]);

  // メニュー編集コンテナを閉じる場合、メニュー情報を初期化する
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
      {/* MenuEdit Container */}
      <EditBottomSheet
        isVisible={isVisible}
        handleCloseEdit={() => handleCloseMenuEdit(selectedEditMenu)}
        activeTab={activeTab}
        dispatch={dispatch}
        essentialCondition={menuName.length <= 0 || price <= 0}
        optionalCondition={options.some((option) => option.error)}
      >
        {/* Essential */}
        {activeTab === "essential" && (
          <div className="relative flex flex-col space-y-4">
            {/* Menu Name */}
            <div className="relative">
              <input
                onChange={(e) =>
                  dispatch({
                    type: "SET_MENU_NAME",
                    payload: e.target.value,
                  })
                }
                className={`p-2 border-b-2 ${isMobile ? "w-full" : "w-3/4"}`}
                type="text"
                value={menuName}
                placeholder="Enter menu name (example: Chicken Burger)"
              />
              {/* Menu Name Error */}
              <span className="absolute text-sm text-red-500 right-5">
                {menuName.length <= 0 && "※ Category name is required"}
              </span>
            </div>
            {/* Menu Price */}
            <div className="relative">
              <input
                onChange={(e) => {
                  if (e.target.value.startsWith("0")) {
                    e.target.value = e.target.value.slice(1);
                  }
                  dispatch({
                    type: "SET_PRICE",
                    payload: Number(e.target.value),
                  });
                }}
                className={`p-2 border-b-2 ${isMobile ? "w-full" : "w-3/4"}`}
                type="number"
                value={price}
                placeholder="Enter menu price (example: 990))"
              />
              {/* Menu Price Error */}
              <span className="absolute top-0 text-sm text-red-500 right-5">
                {price <= 0 && "※ Price is required"}
              </span>
            </div>
            {/* Menu Image */}
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
            {/* Menu Description */}
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
            {/* Menu Sub Category */}
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
        {/* Optional */}
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
        {/* Footer */}
        <EditBottomSheetFooter
          previousData={selectedEditMenu}
          handleSave={() => handleSave(selectedEditMenu, selectedCategory)}
          handleDelete={() => handleDeleteMenuItem(selectedEditMenu)}
          handleCloseEdit={() => handleCloseMenuEdit(selectedEditMenu)}
          deleteCondition={isAiImageLoading}
          saveCondition={isSaveBtnDisabled}
        />
      </EditBottomSheet>
    </form>
  );
}
