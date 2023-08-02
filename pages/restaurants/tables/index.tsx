import Layout from "@/components/Layout";
import LoadingOverlay from "@/components/LoadingOverlay";
import { StatusBar } from "@/components/StatusBar";
import { TableType } from "@/constants/type";
import { IRestaurant, getRestaurantAllInfo } from "@/database";
import useLoading from "@/hooks/context/useLoading";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import useMutation from "@/lib/client/useMutation";
import { ApiError } from "@/lib/shared/ApiError";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import {
  IPostRestaurantTableBody,
  IPutRestaurantTableBody,
} from "@/pages/api/v1/restaurants/table";
import convertStringsToNumbers from "@/utils/convertStringsToNumbers";
import { isFormChanged } from "@/utils/formHelper";
import isEmpty from "@/utils/validation/isEmpty";
import { Restaurant, TableTypeAssignment } from "@prisma/client";
import { GetServerSidePropsContext } from "next";
import { Session, getServerSession } from "next-auth";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { FieldValues, useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";

type RestaurantInfoProps = {
  initErr: Error;
};

function RestaurantsTables({ initErr }: RestaurantInfoProps) {
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
  } = useSWR<IRestaurant>("/api/v1/me/restaurants", {
    onError: async (err: ApiError) => {
      if (err.statusCode === 307 && err.redirectUrl) {
        await router.replace(err.redirectUrl);
        addToast("error", err.message);
      }
    },
  });
  const [createRestaurantTable, { error: createRestaurantTableErr }] =
    useMutation<Restaurant, IPostRestaurantTableBody>(
      "/api/v1/restaurants/table",
      "POST"
    );
  const [upsertRestaurantTable, { error: upsertRestaurantInfoErr }] =
    useMutation<TableTypeAssignment, IPutRestaurantTableBody[]>(
      "/api/v1/restaurants/table",
      "PUT"
    );
  const { addToast } = useToast();
  const { showConfirm } = useConfirm();
  const router = useRouter();
  const withLoading = useLoading();

  const prevTableNumber =
    restaurantInfo?.restaurantTables[0]?.tableTypeAssignments?.filter(
      (data) => data.tableType === TableType.TABLE
    )[0]?.number;
  const prevCounterNumber =
    restaurantInfo?.restaurantTables[0]?.tableTypeAssignments?.filter(
      (data) => data.tableType === TableType.COUNTER
    )[0]?.number;

  const isValid =
    (Number(tableNumber) > 0 || Number(counterNumber) > 0) &&
    tableNumber !== undefined &&
    counterNumber !== undefined;

  const handleNext = async (formData: FieldValues) => {
    if (isEmpty(restaurantInfo?.restaurantTables[0])) {
      withLoading(() => handleCreateRestaurantTables(formData));
      return;
    }
    handleConfirm(formData, "/menus");
  };

  const handlePrevious = (formData: FieldValues) => {
    if (isEmpty(restaurantInfo?.restaurantTables[0])) {
      router.push("/restaurants/hours");
      return;
    }
    handleConfirm(formData, "/restaurants/hours");
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
      title: "店舗情報の更新",
      message: "変更された情報があります。変更内容を保存しますか？",
      confirmText: "保存する",
      cancelText: "保存しない",
      onConfirm: () =>
        withLoading(() => handleUpsertRestaurantTables(formData, destination)),
      onCancel: () => {
        router.push(destination);
        return;
      },
    });
  };

  const handleCreateRestaurantTables = async (formData: FieldValues) => {
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

    const resultData = await createRestaurantTable(paramData);
    if (resultData) {
      await router.push("/menus");
      addToast("info", "店舗情報を正常に登録しました");
    }
  };

  const handleUpsertRestaurantTables = async (
    formData: FieldValues,
    destination: string
  ) => {
    if (isSubmitting || !isValid || !isEmpty(errors)) {
      return;
    }

    let tableParamData = null;
    let counterParamData = null;

    if (formData?.tableNumber !== prevTableNumber) {
      tableParamData = {
        restaurantTableId: restaurantInfo?.restaurantTables[0].id,
        tableType: TableType.TABLE,
        number: formData?.tableNumber,
      } as IPutRestaurantTableBody;
    }

    if (formData?.counterNumber !== prevCounterNumber) {
      counterParamData = {
        restaurantTableId: restaurantInfo?.restaurantTables[0].id,
        tableType: TableType.COUNTER,
        number: formData?.counterNumber,
      } as IPutRestaurantTableBody;
    }

    const paramData = [
      tableParamData,
      counterParamData,
    ] as IPutRestaurantTableBody[];

    if (tableParamData || counterParamData) {
      const resultData = await upsertRestaurantTable(paramData);
      if (resultData) {
        await router.push(destination);
        addToast("info", "店舗情報を正常に更新しました");
      }
    } else {
      router.push(destination);
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
    if (createRestaurantTableErr) {
      addToast("error", createRestaurantTableErr.message);
    }
  }, [createRestaurantTableErr]);

  useEffect(() => {
    if (upsertRestaurantInfoErr) {
      addToast("error", upsertRestaurantInfoErr.message);
    }
  }, [upsertRestaurantInfoErr]);

  useEffect(() => {
    if (initErr) {
      addToast("error", initErr.message);
    }
  }, [initErr]);

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
      <StatusBar
        steps={["Info", "Hours", "Tables", "Menus", "Complete"]}
        currentStep="Tables"
      />
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
              <label className="block mb-2">Number of Tables (1-200)</label>
              <input
                className="w-1/2 px-3 py-2 text-gray-700 placeholder-gray-500 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:outline-none"
                type="number"
                min={0}
                max={200}
                maxLength={3}
                {...register("tableNumber", {
                  required: "Table number is required",
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: "Table number must be a positive number",
                  },
                  max: {
                    value: 200,
                    message: "Table number must be less than 200",
                  },
                })}
                onInput={(e) => {
                  const input = e.target as HTMLInputElement;
                  if (input.value.length > 3) {
                    input.value = input.value.slice(0, 3);
                  }
                  if (Number(input.value) > 200) {
                    setValue("tableNumber", 200);
                  }
                }}
              />
              {errors.tableNumber && (
                <p className="text-red-600">{errors.tableNumber.message}</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block mb-2">Number of Counters (1-100)</label>
              <input
                className="w-1/2 px-3 py-2 text-gray-700 placeholder-gray-500 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:outline-none"
                type="number"
                min={0}
                max={100}
                maxLength={3}
                {...register("counterNumber", {
                  required: "Counter number is required",
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: "Counter number must be a positive number",
                  },
                  max: {
                    value: 200,
                    message: "Counter number must be less than 200",
                  },
                })}
                onInput={(e) => {
                  const input = e.target as HTMLInputElement;
                  if (input.value.length > 3) {
                    input.value = input.value.slice(0, 3);
                  }
                  if (Number(input.value) > 100) {
                    setValue("counterNumber", 100);
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
          destination: "/auth/signin?error=Unauthorized",
          permanent: false,
        },
      };
    }

    const restaurantInfo = await getRestaurantAllInfo(session.id);
    return {
      props: {
        fallback: {
          "/api/v1/me/restaurants": restaurantInfo,
        },
      },
    };
  } catch (err) {
    // TODO: send error to sentry
    console.error(err);
    return {
      props: {
        initErr: err,
      },
    };
  }
}

export default function Page({ fallback, initErr }: any) {
  return (
    <SWRConfig value={{ fallback }}>
      <RestaurantsTables initErr={initErr} />
    </SWRConfig>
  );
}
