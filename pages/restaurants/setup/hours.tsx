import Layout from "@/components/Layout";
import LoadingOverlay from "@/components/LoadingOverlay";
import { StatusBar } from "@/components/StatusBar";
import { ME_ENDPOINT, RESTAURANT_ENDPOINT } from "@/constants/endpoint";
import {
  AUTH_EXPECTED_ERROR,
  AUTH_QUERY_PARAMS,
} from "@/constants/errorMessage/auth";
import { COMMON_ERROR } from "@/constants/errorMessage/client";
import { RESTAURANT_HOURS_ERROR } from "@/constants/errorMessage/validation";
import { Method } from "@/constants/fetch";
import { CONFIRM_DIALOG_MESSAGE } from "@/constants/message/confirm";
import { TOAST_MESSAGE } from "@/constants/message/toast";
import { RESTAURANT_SETUP_STEPS } from "@/constants/status";
import { AUTH_URL, RESTAURANT_URL } from "@/constants/url";
import { IRestaurant, getRestaurant } from "@/database";
import useLoading from "@/hooks/context/useLoading";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import useMutation from "@/lib/client/useMutation";
import { ApiError } from "@/lib/shared/error/ApiError";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { IPatchRestaurantInfoBody } from "@/pages/api/v1/restaurants/infos";
import { isFormChanged } from "@/utils/formHelper";
import isEmpty from "@/utils/validation/isEmpty";
import isEqualArrays from "@/utils/validation/isEqualArrays";
import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { MobileTimePicker } from "@mui/x-date-pickers";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";
import { Restaurant } from "@prisma/client";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { GetServerSidePropsContext } from "next";
import { Session, getServerSession } from "next-auth";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

type RestaurantHoursProps = {
  initErrMsg: string;
};

function RestaurantHours({ initErrMsg }: RestaurantHoursProps) {
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
      endTime: "00:00",
      lastOrder: "23:00",
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
    useMutation<Restaurant, IPatchRestaurantInfoBody>(
      RESTAURANT_ENDPOINT.INFO,
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
  const [days, setDays] = useState<string[]>([]);
  const [unspecified, setUnspecified] = useState(false);
  const { addToast } = useToast();
  const { showConfirm } = useConfirm();
  const withLoading = useLoading();

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
        router.push(destination);
        return;
      }
    }

    showConfirm({
      title: CONFIRM_DIALOG_MESSAGE.UPDATE_INFO.TITLE,
      message: CONFIRM_DIALOG_MESSAGE.UPDATE_INFO.MESSAGE,
      confirmText: CONFIRM_DIALOG_MESSAGE.UPDATE_INFO.CONFIRM_TEXT,
      cancelText: CONFIRM_DIALOG_MESSAGE.UPDATE_INFO.CANCEL_TEXT,
      onConfirm: () =>
        withLoading(() => handleSubmitRestaurantHours(formData, destination)),
      onCancel: () => {
        router.push(destination);
        return;
      },
    });
  };

  const handleSubmitRestaurantHours = async (
    formData: FieldValues,
    destination: string
  ) => {
    if (isSubmitting || !isEmpty(errors)) {
      return;
    }

    const paramData = {
      ...formData,
      holidays: sortDays(days),
    } as IPatchRestaurantInfoBody;

    const resultData = await updateRestaurantInfo(paramData, {
      additionalKeys: [ME_ENDPOINT.RESTAURANT],
    });
    if (resultData) {
      await router.push(destination);
      addToast(
        "info",
        restaurantInfo?.startTime && restaurantInfo?.endTime
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
      <StatusBar steps={RESTAURANT_SETUP_STEPS} currentStep="Hours" />
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
                    // renderInput={(props) => <TextField {...props} />}
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
            <button
              type="button"
              className="p-2 mr-4 text-white rounded bg-sky-600 hover:bg-sky-700"
              onClick={handleSubmit(handlePrevious)}
            >
              Previous
            </button>
            <button
              className={`p-2 text-white bg-green-600 rounded ${
                isEmpty(errors) && !isSubmitting
                  ? "hover:bg-green-700"
                  : "opacity-60 cursor-not-allowed"
              }`}
              type="button"
              disabled={!isEmpty(errors) || isSubmitting}
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

    const restaurantInfo = await getRestaurant(session.id);
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
      <RestaurantHours initErrMsg={initErrMsg} />
    </SWRConfig>
  );
}
