import Layout from "@/components/Layout";
import LoadingOverlay from "@/components/LoadingOverlay";
import { StatusBar } from "@/components/StatusBar";
import {
  ME_ENDPOINT,
  OWNER_ENDPOINT,
  RESTAURANT_ENDPOINT,
} from "@/constants/endpoint";
import { RESTAURANT_HOURS_ERROR } from "@/constants/errorMessage/validation";
import { Method } from "@/constants/fetch";
import { CONFIRM_DIALOG_MESSAGE } from "@/constants/message/confirm";
import { TOAST_MESSAGE } from "@/constants/message/toast";
import { RESTAURANT_SETUP_STEPS } from "@/constants/status";
import { RESTAURANT_URL } from "@/constants/url";
import { IRestaurant, getRestaurant } from "@/database";
import useLoading from "@/hooks/context/useLoading";
import { useAlert } from "@/hooks/useAlert";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import useMutation from "@/lib/client/useMutation";
import withSSRHandler, { InitialMessage } from "@/lib/server/withSSRHandler";
import { ApiError } from "@/lib/shared/error/ApiError";
import { IPatchRestaurantInfoBody } from "@/pages/api/v1/owner/restaurants/[restaurantId]";
import { allInfoRegisteredState } from "@/recoil/state/infoState";
import convertDatesToISOString from "@/utils/converter/convertDatesToISOString";
import isEmpty from "@/utils/validation/isEmpty";
import isEqualArrays from "@/utils/validation/isEqualArrays";
import isFormChanged from "@/utils/validation/isFormChanged";
import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { MobileTimePicker } from "@mui/x-date-pickers";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";
import { Restaurant } from "@prisma/client";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { useRecoilValue } from "recoil";
import useSWR, { SWRConfig } from "swr";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

type RestaurantHoursProps = {
  initMsg: InitialMessage | undefined | null;
};

type PageProps = RestaurantHoursProps & {
  fallback: any;
};

function RestaurantHours({ initMsg }: RestaurantHoursProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      startTime: "17:00",
      endTime: "23:00",
      lastOrder: "22:00",
    },
  });
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
  const [updateRestaurantInfo, { error: updateRestaurantInfoErr }] =
    useMutation<Restaurant, IPatchRestaurantInfoBody, RestaurantDynamicUrl>(
      ({ restaurantId }) => OWNER_ENDPOINT.RESTAURANT.BASE(restaurantId),
      Method.PATCH
    );
  const router = useRouter();
  const weekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const { startTime, endTime, lastOrder } = watch();
  const isAllInfoRegistered = useRecoilValue(allInfoRegisteredState);
  const [days, setDays] = useState<string[]>([]);
  const [unspecified, setUnspecified] = useState(false);
  const { addToast } = useToast();
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();
  const withLoading = useLoading();

  const isDisabled = !isEmpty(errors) || isSubmitting;

  const sortDays = (days: string[]) => {
    return days.sort((a, b) => {
      return weekdays.indexOf(a) - weekdays.indexOf(b);
    });
  };

  const handleChangeDays = (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    newDays: string[]
  ) => {
    if (newDays.length === 7) {
      addToast("info", RESTAURANT_HOURS_ERROR.HOLIDAY_CANNOT_SPECIFIY);
      return;
    }
    setDays(newDays);
  };

  const handleUnspecified = () => {
    setUnspecified(!unspecified);
  };

  const handlePrevious = (formData: FieldValues) => {
    if (!(restaurantInfo?.startTime && restaurantInfo?.endTime)) {
      router.push(RESTAURANT_URL.SETUP.INFO);
      return;
    }
    updateConfirm(formData, RESTAURANT_URL.SETUP.INFO);
  };

  const handleNext = (formData: FieldValues) => {
    if (!(restaurantInfo?.startTime && restaurantInfo?.endTime)) {
      withLoading(() =>
        handleSubmitRestaurantHours(formData, RESTAURANT_URL.SETUP.TABLES)
      );
      return;
    }
    updateConfirm(formData, RESTAURANT_URL.SETUP.TABLES);
  };

  const updateConfirm = (formData: FieldValues, destination: string) => {
    if (isSubmitting || !isEmpty(errors)) {
      return;
    }

    if (restaurantInfo) {
      const { holidays, ...prevRestaurantHours } = restaurantInfo;
      const safeHolidays = Array.isArray(holidays) ? holidays : [];
      if (
        !isFormChanged(prevRestaurantHours, formData) &&
        isEqualArrays(safeHolidays, days)
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
    }

    showConfirm({
      title: CONFIRM_DIALOG_MESSAGE.UPDATE_INFO.TITLE,
      message: CONFIRM_DIALOG_MESSAGE.UPDATE_INFO.MESSAGE,
      confirmText: CONFIRM_DIALOG_MESSAGE.UPDATE_INFO.CONFIRM_TEXT,
      cancelText: CONFIRM_DIALOG_MESSAGE.UPDATE_INFO.CANCEL_TEXT,
      buttonType: "info",
      onConfirm: () =>
        withLoading(() => handleSubmitRestaurantHours(formData, destination)),
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

  const handleSubmitRestaurantHours = async (
    formData: FieldValues,
    destination: string
  ) => {
    if (isSubmitting || !isEmpty(errors) || !restaurantInfo) {
      return;
    }

    const paramData = {
      ...formData,
      holidays: sortDays(days),
    } as IPatchRestaurantInfoBody;

    const resultData = await updateRestaurantInfo(paramData, {
      dynamicUrl: {
        restaurantId: restaurantInfo.id,
      },
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
        restaurantInfo.startTime && restaurantInfo.endTime
          ? TOAST_MESSAGE.INFO.UPDATE_SUCCESS
          : TOAST_MESSAGE.INFO.REGISTRATION_SUCCESS
      );
    }
  };

  const validateTime = (value: string) => {
    const format = "HH:mm";
    const startTimeDuration = dayjs(startTime, format);
    let endTimeDuration = dayjs(endTime, format);
    let valueDuration = dayjs(value, format);

    if (endTimeDuration.isBefore(startTimeDuration)) {
      endTimeDuration = endTimeDuration.add(1, "day");
    }

    if (valueDuration.isBefore(startTimeDuration)) {
      valueDuration = valueDuration.add(1, "day");
    }

    return (
      valueDuration.isSameOrAfter(startTimeDuration) &&
      valueDuration.isSameOrBefore(endTimeDuration)
    );
  };

  useEffect(() => {
    if (restaurantInfo) {
      const { startTime, endTime, lastOrder, holidays } = restaurantInfo;
      if (startTime) {
        setValue("startTime", startTime);
      }
      if (endTime) {
        setValue("endTime", endTime);
      }
      if (lastOrder) {
        setValue("lastOrder", lastOrder);
      }
      if (holidays) {
        const safeHolidays = Array.isArray(holidays)
          ? (holidays as string[])
          : [];
        setDays(safeHolidays);
      }
    }
  }, [restaurantInfo]);

  useEffect(() => {
    if (unspecified) {
      setValue("lastOrder", endTime);
    }
  }, [unspecified, endTime, setValue]);

  useEffect(() => {
    if (!validateTime(lastOrder)) {
      setError("lastOrder", {
        type: "manual",
        message: "Last Order must be within Business Hours",
      });
    } else {
      clearErrors("lastOrder");
    }
  }, [lastOrder, setError, clearErrors]);

  useEffect(() => {
    if (updateRestaurantInfoErr) {
      addToast("error", updateRestaurantInfoErr.message);
    }
  }, [updateRestaurantInfoErr]);

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
        <StatusBar steps={RESTAURANT_SETUP_STEPS} currentStep="Hours" />
      )}
      {isSubmitting && <LoadingOverlay />}
      {isValidating ? (
        <LoadingOverlay />
      ) : (
        <div className="container px-4 py-8 mx-auto">
          <h1 className="mb-4 text-2xl font-semibold">
            Enter the restaurant&apos;s business hours and holidays
          </h1>
          <p className="mb-6">
            This page helps you enter your restaurant&apos;s business hours and
            holidays.
          </p>
          <form>
            {/* Business hours */}
            <div className="mb-4">
              <label className="block mb-2">Business Hours</label>
              <div className="flex">
                <div className="">
                  <MobileTimePicker
                    className="bg-white"
                    label="Start Time"
                    ampm={false}
                    minutesStep={5}
                    {...register("startTime")}
                    value={dayjs(startTime, "HH:mm")}
                    viewRenderers={{
                      hours: renderTimeViewClock,
                      minutes: renderTimeViewClock,
                    }}
                    onChange={(dateObj) => {
                      if (dateObj) {
                        const dayjsObj = dayjs(dateObj);
                        const hour = dayjsObj
                          .hour()
                          .toString()
                          .padStart(2, "0");
                        const minute = dayjsObj
                          .minute()
                          .toString()
                          .padStart(2, "0");
                        setValue("startTime", `${hour}:${minute}`);
                      }
                    }}
                  />
                </div>
                <span className="mx-2"></span>
                <div>
                  <MobileTimePicker
                    className="bg-white"
                    label="End Time"
                    ampm={false}
                    minutesStep={5}
                    {...register("endTime")}
                    value={dayjs(endTime, "HH:mm")}
                    viewRenderers={{
                      hours: renderTimeViewClock,
                      minutes: renderTimeViewClock,
                    }}
                    onChange={(dateObj) => {
                      if (dateObj) {
                        const dayjsObj = dayjs(dateObj);
                        const hour = dayjsObj
                          .hour()
                          .toString()
                          .padStart(2, "0");
                        const minute = dayjsObj
                          .minute()
                          .toString()
                          .padStart(2, "0");
                        setValue("endTime", `${hour}:${minute}`);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            {/* Regular Holidays */}
            <div className="mb-4">
              <label className="block mb-2">Regular Holidays</label>
              <Box sx={{ width: "100%" }}>
                <ToggleButtonGroup
                  className="bg-white border border-gray-300 rounded-md"
                  color="primary"
                  value={days}
                  onChange={handleChangeDays}
                >
                  {weekdays.map((day, index) => (
                    <ToggleButton key={index} value={day}>
                      {day}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            </div>
            {/* Last Order */}
            <div className="mb-4">
              <label className="block mb-2">Last Order</label>
              <MobileTimePicker
                className={`${errors.lastOrder ? "bg-red-200" : "bg-white"}`}
                ampm={false}
                minutesStep={5}
                sx={{ borderColor: "black" }}
                {...register("lastOrder", {
                  validate: (value) =>
                    validateTime(value) ||
                    RESTAURANT_HOURS_ERROR.LAST_ORDER_BUINESS_HOUR_INVALID,
                })}
                viewRenderers={{
                  hours: renderTimeViewClock,
                  minutes: renderTimeViewClock,
                }}
                value={dayjs(lastOrder, "HH:mm")}
                onChange={(dateObj) => {
                  if (dateObj) {
                    const dayjsObj = dayjs(dateObj);
                    const hour = dayjsObj.hour().toString().padStart(2, "0");
                    const minute = dayjsObj
                      .minute()
                      .toString()
                      .padStart(2, "0");
                    setValue("lastOrder", `${hour}:${minute}`);
                  }
                }}
                disabled={unspecified}
              />
              <span className="ml-2">
                <input
                  type="checkbox"
                  className=""
                  checked={unspecified}
                  onChange={handleUnspecified}
                />
                <span className="ml-1">Unspecified</span>
              </span>
              {errors.lastOrder && (
                <p className="text-red-600">{errors.lastOrder.message}</p>
              )}
            </div>
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
              className={`mt-2 p-2 w-28 text-lg text-white bg-green-600 rounded ${
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
        convertDatesToISOString(await getRestaurant(session?.id)),
    },
  });
}

export default function Page({ fallback, initMsg }: PageProps) {
  return (
    <SWRConfig value={{ fallback }}>
      <RestaurantHours initMsg={initMsg} />
    </SWRConfig>
  );
}
