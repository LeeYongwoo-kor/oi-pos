import Layout from "@/components/Layout";
import LoadingOverlay from "@/components/LoadingOverlay";
import { StatusBar } from "@/components/StatusBar";
import { IRestaurant, getRestaurantAllInfo } from "@/database";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import useMutation from "@/lib/client/useMutation";
import { ApiError } from "@/lib/shared/ApiError";
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
import { authOptions } from "../api/auth/[...nextauth]";
import { IPatchRestaurantInfoBody } from "../api/v1/restaurants/info";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

type RestaurantHoursProps = {
  initErr: Error;
};

function RestaurantHours({ initErr }: RestaurantHoursProps) {
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
  } = useSWR<IRestaurant>("/api/v1/me/restaurants", {
    onError: async (err: ApiError) => {
      if (err.statusCode === 307 && err.redirectUrl) {
        await router.replace(err.redirectUrl);
        addToast("error", err.message);
      }
    },
  });
  const [updateRestaurantInfo, { error: updateRestaurantInfoErr }] =
    useMutation<Restaurant, IPatchRestaurantInfoBody>(
      "/api/v1/restaurants/info",
      "PATCH"
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
      addToast("info", "You cannot specify all days as holidays");
      return;
    }
    setDays(newDays);
  };

  const handleUnspecified = () => {
    setUnspecified(!unspecified);
  };

  const handlePrevious = (formData: FieldValues) => {
    if (!(restaurantInfo?.startTime && restaurantInfo?.endTime)) {
      router.push("/restaurants/info");
      return;
    }
    updateConfirm(formData, "/restaurants/info");
  };

  const handleNext = (formData: FieldValues) => {
    if (!(restaurantInfo?.startTime && restaurantInfo?.endTime)) {
      handleSubmitRestaurantHours(formData, "/restaurants/tables");
      return;
    }
    updateConfirm(formData, "/restaurants/tables");
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
      title: "店舗情報の更新",
      message: "変更された情報があります。変更内容を保存しますか？",
      confirmText: "保存する",
      cancelText: "保存しない",
      onConfirm: () => handleSubmitRestaurantHours(formData, destination),
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

    const resultData = await updateRestaurantInfo(paramData);
    if (resultData) {
      await router.push(destination);
      addToast(
        "info",
        restaurantInfo?.startTime && restaurantInfo?.endTime
          ? "店舗情報を正常に更新しました"
          : "店舗情報を正常に登録しました"
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
        currentStep="Hours"
      />
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
                    "Last Order must be within Business Hours",
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
      <RestaurantHours initErr={initErr} />
    </SWRConfig>
  );
}
