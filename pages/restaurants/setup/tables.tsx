import Layout from "@/components/Layout";
import LoadingOverlay from "@/components/LoadingOverlay";
import { StatusBar } from "@/components/StatusBar";
import {
  ME_ENDPOINT,
  OWNER_ENDPOINT,
  RESTAURANT_ENDPOINT,
} from "@/constants/endpoint";
import { RESTAURANT_TABLES_ERROR } from "@/constants/errorMessage/validation";
import { Method } from "@/constants/fetch";
import { CONFIRM_DIALOG_MESSAGE } from "@/constants/message/confirm";
import { TOAST_MESSAGE } from "@/constants/message/toast";
import { COUNTER_NUMBER_MAX, TABLE_NUMBER_MAX } from "@/constants/plan";
import { RESTAURANT_SETUP_STEPS } from "@/constants/status";
import { TableType } from "@/constants/type";
import { RESTAURANT_URL } from "@/constants/url";
import { IRestaurant, getRestaurantByUserId } from "@/database";
import useLoading from "@/hooks/context/useLoading";
import { useAlert } from "@/hooks/useAlert";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import useMutation from "@/lib/client/useMutation";
import withSSRHandler, { InitialMessage } from "@/lib/server/withSSRHandler";
import { ApiError } from "@/lib/shared/error/ApiError";
import { IPostRestaurantTableBody } from "@/pages/api/v1/owner/restaurants/[restaurantId]";
import { allInfoRegisteredState } from "@/recoil/state/infoState";
import convertDatesToISOString from "@/utils/converter/convertDatesToISOString";
import convertStringsToNumbers from "@/utils/converter/convertStringsToNumbers";
import isEmpty from "@/utils/validation/isEmpty";
import isFormChanged from "@/utils/validation/isFormChanged";
import { Restaurant } from "@prisma/client";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { useRecoilValue } from "recoil";
import useSWR, { SWRConfig } from "swr";

type RestaurantInfoProps = {
  initMsg: InitialMessage | undefined | null;
};

type PageProps = RestaurantInfoProps & {
  fallback: any;
};

function RestaurantsTables({ initMsg }: RestaurantInfoProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting, errors },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      tableNumber: 0,
      counterNumber: 0,
    },
  });
  const { tableNumber, counterNumber } = watch();
  const {
    data: restaurantInfo,
    error: restaurantInfoErr,
    isValidating,
  } = useSWR<IRestaurant>(ME_ENDPOINT.RESTAURANT, {
    onError: async (err: ApiError) => {
      if (err.statusCode === 307 && err.redirectUrl) {
        await router.replace(err.redirectUrl);
        addToast("error", err.message);
      }
    },
  });
  const [
    createOrDeleteRestaurantTables,
    { error: createOrDeleteRestaurantTablesErr },
  ] = useMutation<Restaurant, IPostRestaurantTableBody>(
    restaurantInfo ? OWNER_ENDPOINT.RESTAURANT.BASE(restaurantInfo.id) : null,
    Method.POST
  );
  const isAllInfoRegistered = useRecoilValue(allInfoRegisteredState);
  const [prevTableNumber, setPrevTableNumber] = useState(0);
  const [prevCounterNumber, setPrevCounterNumber] = useState(0);
  const { addToast } = useToast();
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();
  const router = useRouter();
  const withLoading = useLoading();

  const isValid =
    (Number(tableNumber) > 0 || Number(counterNumber) > 0) &&
    tableNumber !== undefined &&
    counterNumber !== undefined;

  const isDisabled = !isValid || !isEmpty(errors) || isSubmitting;

  const handleNext = async (formData: FieldValues) => {
    if (isEmpty(restaurantInfo?.restaurantTables)) {
      withLoading(() =>
        handleCreateOrDeleteRestaurantTables(
          formData,
          RESTAURANT_URL.SETUP.MENUS
        )
      );
      return;
    }
    handleConfirm(formData, RESTAURANT_URL.SETUP.MENUS);
  };

  const handlePrevious = (formData: FieldValues) => {
    handleConfirm(formData, RESTAURANT_URL.SETUP.HOURS);
  };

  const handleConfirm = (formData: FieldValues, destination: string) => {
    if (
      !isFormChanged(
        {
          tableNumber: prevTableNumber,
          counterNumber: prevCounterNumber,
        },
        convertStringsToNumbers(formData)
      )
    ) {
      if (isAllInfoRegistered) {
        showAlert({
          title: "案内",
          message: "変更された内容がありません",
        });
        return;
      }
      router.push(destination);
      return;
    }

    if (isSubmitting || !isValid || !isEmpty(errors)) {
      return;
    }

    showConfirm({
      title: CONFIRM_DIALOG_MESSAGE.UPDATE_INFO.TITLE,
      message: CONFIRM_DIALOG_MESSAGE.UPDATE_INFO.MESSAGE,
      confirmText: CONFIRM_DIALOG_MESSAGE.UPDATE_INFO.CONFIRM_TEXT,
      cancelText: CONFIRM_DIALOG_MESSAGE.UPDATE_INFO.CANCEL_TEXT,
      buttonType: "info",
      onConfirm: () =>
        withLoading(() =>
          handleCreateOrDeleteRestaurantTables(formData, destination)
        ),
      onCancel: () => {
        if (isAllInfoRegistered) {
          showAlert({
            title: "案内",
            message: "変更された内容がありません",
          });
          return;
        }
        router.push(destination);
        return;
      },
    });
  };

  const handleCreateOrDeleteRestaurantTables = async (
    formData: FieldValues,
    destination: string
  ) => {
    if (isSubmitting || !isValid || !isEmpty(errors) || !restaurantInfo) {
      return;
    }

    const paramData = {
      restaurantId: restaurantInfo.id,
      seatingConfig: {
        tableNumber: formData?.tableNumber,
        counterNumber: formData?.counterNumber,
      },
    } as IPostRestaurantTableBody;

    const resultData = await createOrDeleteRestaurantTables(paramData, {
      additionalKeys: [
        ME_ENDPOINT.RESTAURANT,
        RESTAURANT_ENDPOINT.BASE(restaurantInfo.id),
      ],
    });
    if (resultData) {
      if (!isAllInfoRegistered) {
        await router.push(destination);
      }
      addToast(
        "info",
        restaurantInfo.restaurantTables
          ? TOAST_MESSAGE.INFO.UPDATE_SUCCESS
          : TOAST_MESSAGE.INFO.REGISTRATION_SUCCESS
      );
    }
  };

  useEffect(() => {
    if (restaurantInfo && restaurantInfo.restaurantTables) {
      const prevTableNumber =
        restaurantInfo.restaurantTables.filter(
          (data) => data.tableType === TableType.TABLE
        ).length ?? 0;

      const prevCounterNumber =
        restaurantInfo.restaurantTables.filter(
          (data) => data.tableType === TableType.COUNTER
        ).length ?? 0;

      setPrevTableNumber(prevTableNumber);
      setPrevCounterNumber(prevCounterNumber);

      setValue("tableNumber", prevTableNumber, {
        shouldTouch: true,
      });

      setValue("counterNumber", prevCounterNumber, {
        shouldTouch: true,
      });
    }
  }, [restaurantInfo, setValue, restaurantInfo?.restaurantTables]);

  useEffect(() => {
    if (createOrDeleteRestaurantTablesErr) {
      addToast("error", createOrDeleteRestaurantTablesErr.message);
    }
  }, [createOrDeleteRestaurantTablesErr]);

  useEffect(() => {
    if (initMsg && !isEmpty(initMsg)) {
      addToast(initMsg.type, initMsg.message);
    }
  }, [initMsg?.message, initMsg?.type]);

  useEffect(() => {
    if (restaurantInfoErr) {
      if (restaurantInfoErr.redirectUrl || restaurantInfoErr.status === 404) {
        return;
      }
      addToast("error", restaurantInfoErr.message);
    }
  }, [restaurantInfoErr]);

  if (restaurantInfoErr) {
    return <LoadingOverlay />;
  }

  return (
    <Layout>
      {!isAllInfoRegistered && (
        <StatusBar steps={RESTAURANT_SETUP_STEPS} currentStep="Tables" />
      )}
      {isSubmitting && <LoadingOverlay />}
      {isValidating ? (
        <LoadingOverlay />
      ) : (
        <div className="container px-4 py-8 mx-auto">
          <h1 className="mb-4 text-2xl font-semibold">
            Enter the number of tables and counters
          </h1>
          <p className="mb-6">
            This page helps you enter the number of tables and counters at your
            restaurant.
          </p>
          <form>
            <div className="mb-4">
              <label className="block mb-2">
                Number of Tables (1-{TABLE_NUMBER_MAX})
              </label>
              <input
                className="w-1/2 px-3 py-2 text-gray-700 placeholder-gray-500 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:outline-none"
                type="number"
                min={0}
                max={TABLE_NUMBER_MAX}
                maxLength={3}
                {...register("tableNumber", {
                  required: RESTAURANT_TABLES_ERROR.TABLE_NUMBER_REQUIRED,
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: RESTAURANT_TABLES_ERROR.TABLE_NUMBER_POSITIVE,
                  },
                  max: {
                    value: TABLE_NUMBER_MAX,
                    message: RESTAURANT_TABLES_ERROR.TABLE_NUMBER_MAX,
                  },
                })}
                onInput={(e) => {
                  const input = e.target as HTMLInputElement;
                  if (input.value.length > 3) {
                    input.value = input.value.slice(0, 3);
                  }
                  if (Number(input.value) > TABLE_NUMBER_MAX) {
                    setValue("tableNumber", TABLE_NUMBER_MAX);
                  }
                }}
              />
              {errors.tableNumber && (
                <p className="text-red-600">{errors.tableNumber.message}</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block mb-2">
                Number of Counters (1-{COUNTER_NUMBER_MAX})
              </label>
              <input
                className="w-1/2 px-3 py-2 text-gray-700 placeholder-gray-500 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:outline-none"
                type="number"
                min={0}
                max={COUNTER_NUMBER_MAX}
                maxLength={3}
                {...register("counterNumber", {
                  required: RESTAURANT_TABLES_ERROR.COUNTER_NUMBER_REQUIRED,
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: RESTAURANT_TABLES_ERROR.COUNTER_NUMBER_POSITIVE,
                  },
                  max: {
                    value: COUNTER_NUMBER_MAX,
                    message: RESTAURANT_TABLES_ERROR.COUNTER_NUMBER_MAX,
                  },
                })}
                onInput={(e) => {
                  const input = e.target as HTMLInputElement;
                  if (input.value.length > 3) {
                    input.value = input.value.slice(0, 3);
                  }
                  if (Number(input.value) > COUNTER_NUMBER_MAX) {
                    setValue("counterNumber", COUNTER_NUMBER_MAX);
                  }
                }}
              />
              {errors.counterNumber && (
                <p className="text-red-600">{errors.counterNumber.message}</p>
              )}
            </div>
            {!isValid && (
              <div className="mb-3">
                <p className="text-red-600">
                  At least one of Table or Counter number must be greater than
                  zero
                </p>
              </div>
            )}
            {!isAllInfoRegistered && (
              <button
                type="button"
                className="p-2 mt-2 mr-4 text-lg text-white rounded w-28 bg-sky-600 hover:bg-sky-700"
                onClick={handleSubmit(handlePrevious)}
              >
                Previous
              </button>
            )}
            <button
              className={`p-2 mt-2 text-lg w-28 text-white bg-green-600 rounded ${
                isDisabled
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-green-700"
              }`}
              type="button"
              disabled={isDisabled}
              onClick={handleSubmit(handleNext)}
            >
              {isAllInfoRegistered ? "Edit" : "Next"}
            </button>
          </form>
        </div>
      )}
    </Layout>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await withSSRHandler(ctx, {
    fetchers: {
      [ME_ENDPOINT.RESTAURANT]: async (session) =>
        convertDatesToISOString(await getRestaurantByUserId(session?.id)),
    },
  });
}

export default function Page({ fallback, initMsg }: PageProps) {
  return (
    <SWRConfig value={{ fallback }}>
      <RestaurantsTables initMsg={initMsg} />
    </SWRConfig>
  );
}
