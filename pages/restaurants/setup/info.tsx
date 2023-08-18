import Layout from "@/components/Layout";
import LoadingOverlay from "@/components/LoadingOverlay";
import { StatusBar } from "@/components/StatusBar";
import { ME_ENDPOINT, RESTAURANT_ENDPOINT } from "@/constants/endpoint";
import {
  AUTH_EXPECTED_ERROR,
  AUTH_QUERY_PARAMS,
} from "@/constants/errorMessage/auth";
import { COMMON_ERROR } from "@/constants/errorMessage/client";
import { RESTAURANT_INFO_ERROR } from "@/constants/errorMessage/validation";
import { EXTERNAL_ENDPOINT } from "@/constants/external";
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
import { IPutRestaurantInfoBody } from "@/pages/api/v1/restaurants/infos";
import { getInputFormCls } from "@/utils/cssHelper";
import { isFormChanged } from "@/utils/formHelper";
import { yupResolver } from "@hookform/resolvers/yup";
import { Restaurant } from "@prisma/client";
import { GetServerSidePropsContext } from "next";
import { Session, getServerSession } from "next-auth";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FieldErrors, FieldValues, useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
import * as yup from "yup";

type RestaurantInfoProps = {
  fallbackData: IRestaurant | null;
  initErrMsg: string;
};
interface IAddress {
  address1: string;
  address2: string;
  address3: string;
  kana1: string;
  kana2: string;
  kana3: string;
  prefcode: string;
  zipcode: string;
}

interface ZipcodeApiResponse {
  message: string | null;
  results: IAddress[] | null;
  status: number;
}

const schema = yup.object().shape({
  name: yup
    .string()
    .required(RESTAURANT_INFO_ERROR.NAME_REQUIRED)
    .max(30, RESTAURANT_INFO_ERROR.NAME_MAX)
    .matches(
      /^(?=.*\S)[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\w\s-]*$/,
      RESTAURANT_INFO_ERROR.NAME_SPECIAL_CHAR
    ),
  branch: yup
    .string()
    .required(RESTAURANT_INFO_ERROR.BRANCH_REQUIRED)
    .max(30, RESTAURANT_INFO_ERROR.BRANCH_MAX)
    .matches(
      /^(?=.*\S)[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\w\s-]*$/,
      RESTAURANT_INFO_ERROR.BRANCH_SPECIAL_CHAR
    ),
  phoneNumber: yup
    .string()
    .required(RESTAURANT_INFO_ERROR.PHONE_REQUIRED)
    .matches(/^0\d{9,10}$/, RESTAURANT_INFO_ERROR.PHONE_INVALID),
  postCode: yup
    .string()
    .required(RESTAURANT_INFO_ERROR.POST_CODE_REQUIRED)
    .max(7, RESTAURANT_INFO_ERROR.POST_CODE_MAX)
    .matches(/^\d{7}$/, RESTAURANT_INFO_ERROR.POST_CODE_INVALID),
  address: yup.string(),
  restAddress: yup
    .string()
    .required(RESTAURANT_INFO_ERROR.REST_ADDRESS_REQUIRED)
    .max(50, RESTAURANT_INFO_ERROR.REST_ADDRESS_MAX)
    .matches(
      /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF a-zA-Z0-9\s,.'-]*$/,
      RESTAURANT_INFO_ERROR.REST_ADDRESS_SPECIAL_CHAR
    ),
});

const useCheckPostCode = (
  postCode: FieldValues,
  errors: FieldErrors<FieldValues>
) => {
  const {
    data: postCodeResult,
    error: postCodeErr,
    isLoading: checkPostCodeLoading,
  } = useSWR<ZipcodeApiResponse>(
    !errors.postCode && postCode && postCode.length === 7
      ? `${EXTERNAL_ENDPOINT.ZIP_CLOUD_SEARCH}?zipcode=${postCode}`
      : null,
    { keepPreviousData: true }
  );

  return { postCodeResult, postCodeErr, checkPostCodeLoading };
};
const useCheckDuplicatePhoneNumber = (
  phoneNumber: FieldValues,
  errors: FieldErrors<FieldValues>
) => {
  const {
    data: checkDuplicatePhoneNumberResult,
    error: checkDuplicatePhoneNumberErr,
  } = useSWR<{
    isDuplicate: boolean;
  }>(
    !errors.phoneNumber && phoneNumber && phoneNumber.length >= 10
      ? `${RESTAURANT_ENDPOINT.CHECK_PHONE_NUMBER}/${phoneNumber}`
      : null
  );

  return { checkDuplicatePhoneNumberResult, checkDuplicatePhoneNumberErr };
};

function RestaurantInfo({ fallbackData, initErrMsg }: RestaurantInfoProps) {
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    resetField,
    formState: { errors, isValid, isSubmitting, touchedFields },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
  });
  const watchFields = watch();
  const {
    data: restaurantInfo,
    error: restaurantInfoErr,
    isValidating,
  } = useSWR<IRestaurant>(fallbackData ? `${ME_ENDPOINT.RESTAURANT}` : null);

  const { postCodeResult, postCodeErr, checkPostCodeLoading } =
    useCheckPostCode(watchFields.postCode, errors);
  const { checkDuplicatePhoneNumberResult, checkDuplicatePhoneNumberErr } =
    useCheckDuplicatePhoneNumber(watchFields.phoneNumber, errors);
  const [upsertRestaurantInfo, { error: upsertRestaurantInfoErr }] =
    useMutation<Restaurant, IPutRestaurantInfoBody>(
      RESTAURANT_ENDPOINT.INFO,
      Method.PUT
    );
  const { addToast } = useToast();
  const { showConfirm } = useConfirm();
  const [addressValue, setAddressValue] = useState("");
  const router = useRouter();
  const withLoading = useLoading();

  const handleNext = (formData: FieldValues) => {
    if (isSubmitting || !isValid) {
      return;
    }

    if (!restaurantInfo) {
      withLoading(() => handleSubmitRestaurantInfo(formData));
      return;
    }

    if (restaurantInfo && !isFormChanged(restaurantInfo, formData)) {
      router.push(RESTAURANT_URL.SETUP.HOURS);
      return;
    }

    showConfirm({
      title: CONFIRM_DIALOG_MESSAGE.UPDATE_INFO.TITLE,
      message: CONFIRM_DIALOG_MESSAGE.UPDATE_INFO.MESSAGE,
      confirmText: CONFIRM_DIALOG_MESSAGE.UPDATE_INFO.CONFIRM_TEXT,
      cancelText: CONFIRM_DIALOG_MESSAGE.UPDATE_INFO.CANCEL_TEXT,
      onConfirm: () => withLoading(() => handleSubmitRestaurantInfo(formData)),
      onCancel: () => {
        router.push(RESTAURANT_URL.SETUP.HOURS);
        return;
      },
    });
  };

  const handleSubmitRestaurantInfo = async (formData: FieldValues) => {
    if (isSubmitting || !isValid) {
      return;
    }

    const paramData = formData as IPutRestaurantInfoBody;
    const resultData = await upsertRestaurantInfo(paramData, {
      additionalKeys: [ME_ENDPOINT.RESTAURANT],
    });
    if (resultData) {
      await router.push(RESTAURANT_URL.SETUP.HOURS);
      addToast(
        "info",
        restaurantInfo
          ? TOAST_MESSAGE.INFO.UPDATE_SUCCESS
          : TOAST_MESSAGE.INFO.REGISTRATION_SUCCESS
      );
    }
  };

  const checkDuplicatePhoneNumber = async (phoneNumber: string) => {
    if (!phoneNumber || errors.phoneNumber) {
      return;
    }
    if (restaurantInfo?.phoneNumber === phoneNumber) {
      return;
    }

    if (checkDuplicatePhoneNumberResult?.isDuplicate) {
      setError("phoneNumber", {
        type: "manual",
        message: RESTAURANT_INFO_ERROR.PHONE_DUPLICATE,
      });
      addToast("error", RESTAURANT_INFO_ERROR.PHONE_DUPLICATE);
    }
  };

  // Setting restaurantInfo to form (If already exists)
  useEffect(() => {
    if (restaurantInfo) {
      setValue("name", restaurantInfo.name, { shouldTouch: true });
      setValue("branch", restaurantInfo.branch, { shouldTouch: true });
      setValue("phoneNumber", restaurantInfo.phoneNumber, {
        shouldTouch: true,
      });
      setValue("postCode", restaurantInfo.postCode, { shouldTouch: true });
      setValue("address", restaurantInfo.address, { shouldTouch: true });
      setValue("restAddress", restaurantInfo.restAddress, {
        shouldTouch: true,
      });
    }
  }, [restaurantInfo]);

  // If error occurs when SSR, reload the page
  useEffect(() => {
    if (initErrMsg) {
      addToast("error", initErrMsg);
    }
  }, [initErrMsg]);

  // Handles any errors related to restaurantInfo
  useEffect(() => {
    if (restaurantInfoErr) {
      if (restaurantInfoErr.redirectUrl || restaurantInfoErr.status === 404) {
        return;
      }
      addToast("error", restaurantInfoErr.message);
    }
  }, [restaurantInfoErr]);

  // Handles any errors related to upsertRestaurantInfo
  useEffect(() => {
    if (upsertRestaurantInfoErr) {
      addToast("error", upsertRestaurantInfoErr.message);
    }
  }, [upsertRestaurantInfoErr]);

  // Handles any errors related to postCode
  useEffect(() => {
    if (postCodeErr) {
      addToast("error", postCodeErr.message);
    }
  }, [postCodeErr]);

  // Handles any errors related to checkDuplicatePhoneNumber
  useEffect(() => {
    if (checkDuplicatePhoneNumberErr) {
      addToast("error", checkDuplicatePhoneNumberErr.message);
    }
  }, [checkDuplicatePhoneNumberErr]);

  // Resets the 'address' field when 'postCode' field has an error
  useEffect(() => {
    if (errors.postCode) {
      resetField("address");
    }
  }, [errors.postCode]);

  // Handle the loading state
  useEffect(() => {
    if (checkPostCodeLoading) {
      setAddressValue("Loading...");
    }
  }, [checkPostCodeLoading]);

  // Handle the case where we have results
  useEffect(() => {
    if (postCodeResult?.results && postCodeResult.results.length > 0) {
      const addressResult = [
        postCodeResult.results[0].address1,
        postCodeResult.results[0].address2,
        postCodeResult.results[0].address3,
      ]
        .join(" ")
        .trim();
      setAddressValue(addressResult);
      setValue("address", addressResult, { shouldValidate: true });
    }
  }, [postCodeResult]);

  // Handle the case where no results were found
  useEffect(() => {
    if (!checkPostCodeLoading && postCodeResult?.results === null) {
      setAddressValue("");
      addToast("error", RESTAURANT_INFO_ERROR.POST_CODE_NOT_FOUND);
      resetField("address");
    }
  }, [checkPostCodeLoading, postCodeResult]);

  return (
    <Layout>
      <StatusBar steps={RESTAURANT_SETUP_STEPS} currentStep="Info" />
      {isSubmitting && <LoadingOverlay />}
      {isValidating ? (
        <LoadingOverlay />
      ) : (
        <div className="container px-4 py-8 mx-auto">
          <h1 className="mb-4 text-2xl font-semibold">
            Enter basic information about the restaurant
          </h1>
          <p className="mb-6">
            This page helps you enter basic information about your restaurant.
          </p>
          <form onSubmit={handleSubmit(handleNext)}>
            <div className="mb-4">
              <label className="block mb-2">Restaurant Name</label>
              <input
                className={getInputFormCls(
                  "w-full p-2 border",
                  errors.name,
                  touchedFields.name,
                  watchFields.name
                )}
                type="text"
                maxLength={30}
                {...register("name")}
              />
              {errors.name && (
                <span className="text-red-500">
                  {errors.name?.message as string}
                </span>
              )}
            </div>
            <div className="mb-4">
              <label className="block mb-2">Branch Name</label>
              <input
                className={getInputFormCls(
                  "w-full p-2 border",
                  errors.branch,
                  touchedFields.branch,
                  watchFields.branch
                )}
                type="text"
                maxLength={30}
                {...register("branch")}
              />
              {errors.branch && (
                <span className="text-red-500">
                  {errors.branch?.message as string}
                </span>
              )}
            </div>
            <div className="mb-4">
              <label className="block mb-2">
                Restaurant Phone Number (Please omit the -)
              </label>
              <input
                className={`w-full p-2 border ${
                  errors.phoneNumber
                    ? "border-red-500"
                    : watchFields.phoneNumber &&
                      (restaurantInfo?.phoneNumber ===
                        watchFields.phoneNumber ||
                        checkDuplicatePhoneNumberResult?.isDuplicate === false)
                    ? "border-green-500"
                    : "border-gray-400"
                } rounded`}
                type="tel"
                maxLength={11}
                {...register("phoneNumber")}
                onBlur={(e) => checkDuplicatePhoneNumber(e.target.value)}
              />
              {errors.phoneNumber && (
                <span className="text-red-500">
                  {errors.phoneNumber?.message as string}
                </span>
              )}
            </div>
            <label className="block mb-2">
              Japan Postal Code (Please omit the -)
            </label>
            <div className="mb-4">
              <input
                className={`w-full p-2 border ${
                  errors.postCode || postCodeResult?.results === null
                    ? "border-red-500"
                    : touchedFields.postCode &&
                      watchFields.postCode &&
                      postCodeResult?.results !== null
                    ? "border-green-500"
                    : "border-gray-400"
                } rounded`}
                type="text"
                maxLength={7}
                {...register("postCode")}
              />
              {errors.postCode && (
                <span className="text-red-500">
                  {errors.postCode?.message as string}
                </span>
              )}
              {postCodeResult?.results === null && (
                <span className="text-red-500">
                  Post Code not found, Please try again
                </span>
              )}
            </div>
            <div className="mb-4">
              <label className="block mb-2">Address</label>
              <input
                className={getInputFormCls(
                  "w-full p-2 border",
                  errors.address,
                  touchedFields.address,
                  watchFields.address
                )}
                type="text"
                value={addressValue}
                {...register("address")}
                disabled
              />
              {errors.address && (
                <span className="text-red-500">
                  {errors.address?.message as string}
                </span>
              )}
            </div>
            <div className="mb-4">
              <label className="block mb-2">Rest of the Address</label>
              <input
                className={getInputFormCls(
                  "w-full p-2 border",
                  errors.restAddress,
                  touchedFields.restAddress,
                  watchFields.restAddress
                )}
                type="text"
                maxLength={100}
                {...register("restAddress")}
              />
              {errors.restAddress && (
                <span className="text-red-500">
                  {errors.restAddress?.message as string}
                </span>
              )}
            </div>
            <button
              className={`p-2 text-white bg-green-600 rounded ${
                isValid &&
                !isSubmitting &&
                !checkPostCodeLoading &&
                postCodeResult?.results !== null &&
                (checkDuplicatePhoneNumberResult?.isDuplicate === false ||
                  restaurantInfo?.phoneNumber === watchFields.phoneNumber)
                  ? "hover:bg-green-700"
                  : "opacity-60 cursor-not-allowed"
              }}`}
              type="submit"
              disabled={
                !isValid ||
                isSubmitting ||
                checkPostCodeLoading ||
                postCodeResult?.results === null ||
                (checkDuplicatePhoneNumberResult?.isDuplicate &&
                  restaurantInfo?.phoneNumber !== watchFields.phoneNumber)
              }
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
  const fallbackData = fallback[ME_ENDPOINT.RESTAURANT];
  return (
    <SWRConfig value={{ fallback }}>
      <RestaurantInfo fallbackData={fallbackData} initErrMsg={initErrMsg} />
    </SWRConfig>
  );
}
