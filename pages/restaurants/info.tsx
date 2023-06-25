import Layout from "@/components/Layout";
import { StatusBar } from "@/components/StatusBar";
import { useToast } from "@/hooks/useToast";
import useMutation from "@/lib/client/useMutation";
import { yupResolver } from "@hookform/resolvers/yup";
import { Restaurant } from "@prisma/client";
import { useEffect, useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import useSWR from "swr";
import * as yup from "yup";
import { IPutSubscriptionInfoBody } from "@/pages/api/v1/restaurant/info";
import { useRouter } from "next/router";
import { getInputFormCls } from "@/utils/cssHelper";
import { RESTAURANT_INFO } from "@/constants/errorMessage";
import LoadingOverlay from "@/components/LoadingOverlay";

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
    .required(RESTAURANT_INFO.NAME_REQUIRED)
    .max(30, RESTAURANT_INFO.NAME_MAX)
    .matches(
      /^(?=.*\S)[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\w\s-]*$/,
      RESTAURANT_INFO.NAME_SPECIAL_CHAR
    ),
  branch: yup
    .string()
    .required(RESTAURANT_INFO.BRANCH_REQUIRED)
    .max(30, RESTAURANT_INFO.BRANCH_MAX)
    .matches(
      /^(?=.*\S)[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\w\s-]*$/,
      RESTAURANT_INFO.BRANCH_SPECIAL_CHAR
    ),
  phoneNumber: yup
    .string()
    .required(RESTAURANT_INFO.PHONE_REQUIRED)
    .matches(/^0\d{9,10}$/, RESTAURANT_INFO.PHONE_INVALID),
  postCode: yup
    .string()
    .required(RESTAURANT_INFO.POST_CODE_REQUIRED)
    .max(7, RESTAURANT_INFO.POST_CODE_MAX)
    .matches(/^\d{7}$/, RESTAURANT_INFO.POST_CODE_INVALID),
  address: yup.string(),
  restAddress: yup
    .string()
    .required(RESTAURANT_INFO.REST_ADDRESS_REQUIRED)
    .max(50, RESTAURANT_INFO.REST_ADDRESS_MAX)
    .matches(
      /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF a-zA-Z0-9\s,.'-]*$/,
      RESTAURANT_INFO.REST_ADDRESS_SPECIAL_CHAR
    ),
});

export default function RestaurantInfo() {
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
  const { addToast } = useToast();
  const {
    data: postCodeResult,
    error: postCodeErr,
    isLoading,
  } = useSWR<ZipcodeApiResponse>(
    !errors.postCode &&
      watchFields.postCode &&
      watchFields.postCode.length === 7
      ? `https://zip-cloud.appspot.com/api/search?zipcode=${watchFields.postCode}`
      : null,
    { keepPreviousData: true }
  );
  const { data: checkDuplicatePhoneNumberResult } = useSWR<{
    isDuplicate: boolean;
  }>(
    !errors.phoneNumber &&
      watchFields.phoneNumber &&
      watchFields.phoneNumber.length >= 10
      ? `/api/v1/restaurant/check-phone-number/${watchFields.phoneNumber}`
      : null
  );
  const [upsertRestaurantInfo, { error: upsertRestaurantInfoErr }] =
    useMutation<Restaurant, IPutSubscriptionInfoBody>(
      "/api/v1/restaurant/info",
      "PUT"
    );
  const [addressValue, setAddressValue] = useState("");
  const router = useRouter();

  const handleSubmitRestaurantInfo = async (formData: FieldValues) => {
    if (isSubmitting) {
      return;
    }
    const paramData = formData as IPutSubscriptionInfoBody;
    const resultData = await upsertRestaurantInfo(paramData);
    if (resultData) {
      router.push("/restaurants/hours");
    }
  };

  const checkDuplicatePhoneNumber = async (phoneNumber: string) => {
    if (!phoneNumber || errors.phoneNumber) {
      return;
    }

    if (checkDuplicatePhoneNumberResult?.isDuplicate) {
      setError("phoneNumber", {
        type: "manual",
        message: RESTAURANT_INFO.PHONE_DUPLICATE,
      });
      addToast("error", RESTAURANT_INFO.PHONE_DUPLICATE);
    }
  };

  useEffect(() => {
    if (upsertRestaurantInfoErr) {
      addToast("error", upsertRestaurantInfoErr.message);
    }
    if (postCodeErr) {
      addToast("error", postCodeErr.message);
    }
  }, [upsertRestaurantInfoErr, postCodeErr]);

  useEffect(() => {
    if (errors.postCode) {
      resetField("address");
    }
  }, [errors.postCode]);

  useEffect(() => {
    if (isLoading) {
      setAddressValue("Loading...");
    } else if (postCodeResult?.results && postCodeResult.results.length > 0) {
      const addressResult = [
        postCodeResult.results[0].address1,
        postCodeResult.results[0].address2,
        postCodeResult.results[0].address3,
      ]
        .join(" ")
        .trim();
      setAddressValue(addressResult);
      setValue("address", addressResult);
    } else if (!isLoading && postCodeResult?.results === null) {
      setAddressValue("");
      addToast("error", "Post Code not found, Please try again");
      resetField("address");
    }
  }, [postCodeResult, setValue, isLoading]);

  return (
    <Layout>
      <StatusBar
        steps={["Info", "Hours", "Tables", "Menus", "Complete"]}
        currentStep="Info"
      />
      {isSubmitting && <LoadingOverlay />}
      <div className="container px-4 py-8 mx-auto">
        <h1 className="mb-4 text-2xl font-semibold">
          Enter basic information about the restaurant
        </h1>
        <p className="mb-6">
          This page helps you enter basic information about your restaurant.
        </p>
        <form onSubmit={handleSubmit(handleSubmitRestaurantInfo)}>
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
                    checkDuplicatePhoneNumberResult?.isDuplicate === false
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
              !isLoading &&
              postCodeResult?.results !== null &&
              checkDuplicatePhoneNumberResult?.isDuplicate === false
                ? "hover:bg-green-700"
                : "opacity-60 cursor-not-allowed"
            }}`}
            type="submit"
            disabled={
              !isValid ||
              isSubmitting ||
              isLoading ||
              postCodeResult?.results === null ||
              checkDuplicatePhoneNumberResult?.isDuplicate
            }
          >
            NEXT
          </button>
        </form>
      </div>
    </Layout>
  );
}
