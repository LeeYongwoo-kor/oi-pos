import Layout from "@/components/Layout";
import LoadingOverlay from "@/components/LoadingOverlay";
import { StatusBar } from "@/components/StatusBar";
import { ME_ENDPOINT, RESTAURANT_ENDPOINT } from "@/constants/endpoint";
import {
  AUTH_EXPECTED_ERROR,
  AUTH_QUERY_PARAMS,
} from "@/constants/errorMessage/auth";
import { COMMON_ERROR } from "@/constants/errorMessage/client";
import { RESTAURANT_TABLES_ERROR } from "@/constants/errorMessage/validation";
import { Method } from "@/constants/fetch";
import { CONFIRM_DIALOG_MESSAGE } from "@/constants/message/confirm";
import { TOAST_MESSAGE } from "@/constants/message/toast";
import { COUNTER_NUMBER_MAX, TABLE_NUMBER_MAX } from "@/constants/plan";
import { RESTAURANT_SETUP_STEPS } from "@/constants/status";
import { TableType } from "@/constants/type";
import { AUTH_URL, RESTAURANT_URL } from "@/constants/url";
import { IRestaurant, getRestaurantAllInfo } from "@/database";
import useLoading from "@/hooks/context/useLoading";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import useMutation from "@/lib/client/useMutation";
import { ApiError } from "@/lib/shared/error/ApiError";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { IPostRestaurantTableBody } from "@/pages/api/v1/restaurants/tables";
import convertDatesToISOString from "@/utils/converter/convertDatesToISOString";
import convertStringsToNumbers from "@/utils/converter/convertStringsToNumbers";
import { isFormChanged } from "@/utils/formHelper";
import isEmpty from "@/utils/validation/isEmpty";
import { Restaurant } from "@prisma/client";
import { GetServerSidePropsContext } from "next";
import { Session, getServerSession } from "next-auth";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { FieldValues, useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";

type RestaurantInfoProps = {
  initErrMsg: string;
};

function RestaurantsTables({ initErrMsg }: RestaurantInfoProps) {
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
    RESTAURANT_ENDPOINT.TABLE,
    Method.POST
  );
  const { addToast } = useToast();
  const { showConfirm } = useConfirm();
  const router = useRouter();
  const withLoading = useLoading();

  const prevTableNumber = restaurantInfo?.restaurantTables?.filter(
    (data) => data.tableType === TableType.TABLE
  ).length;
  const prevCounterNumber = restaurantInfo?.restaurantTables?.filter(
    (data) => data.tableType === TableType.COUNTER
  ).length;

  const isValid =
    (Number(tableNumber) > 0 || Number(counterNumber) > 0) &&
    tableNumber !== undefined &&
    counterNumber !== undefined;

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
    if (isSubmitting || !isValid || !isEmpty(errors)) {
      return;
    }

    if (
      !isFormChanged(
        {
          tableNumber: prevTableNumber,
          counterNumber: prevCounterNumber,
        },
        convertStringsToNumbers(formData)
      )
    ) {
      router.push(destination);
      return;
    }

    showConfirm({
      title: CONFIRM_DIALOG_MESSAGE.UPDATE_INFO.TITLE,
      message: CONFIRM_DIALOG_MESSAGE.UPDATE_INFO.MESSAGE,
      confirmText: CONFIRM_DIALOG_MESSAGE.UPDATE_INFO.CONFIRM_TEXT,
      cancelText: CONFIRM_DIALOG_MESSAGE.UPDATE_INFO.CANCEL_TEXT,
      onConfirm: () =>
        withLoading(() =>
          handleCreateOrDeleteRestaurantTables(formData, destination)
        ),
      onCancel: () => {
        router.push(destination);
        return;
      },
    });
  };

  const handleCreateOrDeleteRestaurantTables = async (
    formData: FieldValues,
    destination: string
  ) => {
    if (isSubmitting || !isValid || !isEmpty(errors)) {
      return;
    }

    const paramData = {
      restaurantId: restaurantInfo?.id,
      seatingConfig: {
        tableNumber: formData?.tableNumber,
        counterNumber: formData?.counterNumber,
      },
    } as IPostRestaurantTableBody;

    const resultData = await createOrDeleteRestaurantTables(paramData, {
      additionalKeys: [ME_ENDPOINT.RESTAURANT],
    });
    if (resultData) {
      await router.push(destination);
      addToast(
        "info",
        restaurantInfo?.restaurantTables
          ? TOAST_MESSAGE.INFO.UPDATE_SUCCESS
          : TOAST_MESSAGE.INFO.REGISTRATION_SUCCESS
      );
    }
  };

  useEffect(() => {
    if (restaurantInfo) {
      if (prevTableNumber) {
        setValue("tableNumber", prevTableNumber, {
          shouldTouch: true,
        });
      }
      if (prevCounterNumber) {
        setValue("counterNumber", prevCounterNumber, {
          shouldTouch: true,
        });
      }
    }
  }, [restaurantInfo, prevTableNumber, prevCounterNumber]);

  useEffect(() => {
    if (createOrDeleteRestaurantTablesErr) {
      addToast("error", createOrDeleteRestaurantTablesErr.message);
    }
  }, [createOrDeleteRestaurantTablesErr]);

  useEffect(() => {
    if (initErrMsg) {
      addToast("error", initErrMsg);
    }
  }, [initErrMsg]);

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
      <StatusBar steps={RESTAURANT_SETUP_STEPS} currentStep="Tables" />
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
            <button
              type="button"
              className="p-2 mr-4 text-white rounded bg-sky-600 hover:bg-sky-700"
              onClick={handleSubmit(handlePrevious)}
            >
              Previous
            </button>
            <button
              className={`p-2 text-white bg-green-600 rounded ${
                isValid && isEmpty(errors) && !isSubmitting
                  ? "hover:bg-green-700"
                  : "opacity-60 cursor-not-allowed"
              }`}
              type="button"
              disabled={!isValid || !isEmpty(errors) || isSubmitting}
              onClick={handleSubmit(handleNext)}
            >
              Next
            </button>
          </form>
        </div>
      )}
    </Layout>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  try {
    const session: Session | null = await getServerSession(
      ctx.req,
      ctx.res,
      authOptions
    );

    if (!session) {
      return {
        redirect: {
          destination: `${AUTH_URL.LOGIN}?${AUTH_QUERY_PARAMS.ERROR}=${AUTH_EXPECTED_ERROR.UNAUTHORIZED}`,
          permanent: false,
        },
      };
    }

    const restaurantInfo = await convertDatesToISOString(
      getRestaurantAllInfo(session.id)
    );
    return {
      props: {
        fallback: {
          [ME_ENDPOINT.RESTAURANT]: restaurantInfo,
        },
      },
    };
  } catch (err) {
    // TODO: Send error to Sentry
    const errMessage =
      err instanceof ApiError ? err.message : COMMON_ERROR.UNEXPECTED;
    console.error(err);
    return {
      props: {
        initErrMsg: errMessage,
      },
    };
  }
}

export default function Page({ fallback, initErrMsg }: any) {
  return (
    <SWRConfig value={{ fallback }}>
      <RestaurantsTables initErrMsg={initErrMsg} />
    </SWRConfig>
  );
}
