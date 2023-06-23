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
import { IPutSubscriptionInfoBody } from "../api/v1/restaurant/info";
import { useRouter } from "next/router";

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
    .required("Restaurant Name is required")
    .max(30, "Restaurant Name should be at most 30 characters")
    .matches(/^\s*\w.*$/, "No special characters allowed"),
  branch: yup
    .string()
    .required("Branch Name is required")
    .matches(/^\s*\w.*$/, "No special characters allowed"),
  phoneNumber: yup
    .string()
    .matches(/^0\d{9,10}$/, "Must be a valid phone number"),
  postCode: yup
    .string()
    .required("Post Code is required")
    .max(7, "Post Code should be at most 7 characters")
    .matches(/^\d{7}$/, "Must be a valid post code"),
  address: yup.string(),
  restAddress: yup
    .string()
    .required("Rest Address is required")
    .max(50, "Rest Address should be at most 50 characters")
    .matches(
      /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF a-zA-Z0-9\s,.'-]*$/,
      "No special characters allowed other than address characters"
    ),
});

export default function RestaurantInfo() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    resetField,
    formState: { errors, isValid, isSubmitting, touchedFields, isSubmitted },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
  });
  const watchFields = watch();
  const { addToast } = useToast();
  const { data, isLoading } = useSWR<ZipcodeApiResponse>(
    !errors.postCode &&
      watchFields.postCode &&
      watchFields.postCode.length === 7
      ? `https://zip-cloud.appspot.com/api/search?zipcode=${watchFields.postCode}`
      : null,
    { keepPreviousData: true }
  );
  const [upsertRestaurantInfo, { error: upsertRestaurantInfoErr }] =
    useMutation<Restaurant, IPutSubscriptionInfoBody>(
      "/api/v1/restaurant/info",
      "PUT"
    );
  const [addressValue, setAddressValue] = useState("");
  const router = useRouter();

  const handleSubmitRestaurantInfo = async (formData: FieldValues) => {
    if (isSubmitted) {
      return;
    }
    const paramData = formData as IPutSubscriptionInfoBody;
    const resultData = await upsertRestaurantInfo(paramData);
    if (resultData) {
      router.push("/restaurants/hours");
    }
  };

  useEffect(() => {
    if (upsertRestaurantInfoErr) {
      addToast("error", upsertRestaurantInfoErr.message);
    }
  }, [upsertRestaurantInfoErr]);

  useEffect(() => {
    if (errors.postCode) {
      resetField("address");
    }
  }, [errors.postCode]);

  useEffect(() => {
    if (isLoading) {
      setAddressValue("Loading...");
    } else if (data?.results && data.results.length > 0) {
      const addressResult = [
        data.results[0].address1,
        data.results[0].address2,
        data.results[0].address3,
      ]
        .join(" ")
        .trim();
      setAddressValue(addressResult);
      setValue("address", addressResult);
    } else if (!isLoading && data?.results === null) {
      setAddressValue("");
      addToast("error", "Post Code not found, Please try again");
      resetField("address");
    }
  }, [data, setValue, isLoading]);

  return (
    <Layout>
      <StatusBar
        steps={["Info", "Hours", "Tables", "Menus", "Complete"]}
        currentStep="Info"
      />
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
              className={`w-full p-2 border ${
                errors.name
                  ? "border-red-500"
                  : touchedFields.name && watchFields.name
                  ? "border-green-500"
                  : "border-gray-400"
              } rounded`}
              type="text"
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
              className={`w-full p-2 border ${
                errors.branch
                  ? "border-red-500"
                  : touchedFields.branch && watchFields.branch
                  ? "border-green-500"
                  : "border-gray-400"
              } rounded`}
              type="text"
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
                  : touchedFields.phoneNumber && watchFields.phoneNumber
                  ? "border-green-500"
                  : "border-gray-400"
              } rounded`}
              type="tel"
              maxLength={11}
              {...register("phoneNumber")}
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
                errors.postCode || data?.results === null
                  ? "border-red-500"
                  : touchedFields.postCode &&
                    watchFields.postCode &&
                    data?.results !== null
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
            {data?.results === null && (
              <span className="text-red-500">
                Post Code not found, Please try again
              </span>
            )}
          </div>
          <div className="mb-4">
            <label className="block mb-2">Address</label>
            <input
              className={`w-full p-2 border ${
                errors.address
                  ? "border-red-500"
                  : watchFields.address
                  ? "border-green-500"
                  : "border-gray-400"
              } rounded`}
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
              className={`w-full p-2 border ${
                errors.restAddress
                  ? "border-red-500"
                  : touchedFields.restAddress && watchFields.restAddress
                  ? "border-green-500"
                  : "border-gray-400"
              } rounded`}
              type="text"
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
              isValid && !isSubmitting && !isLoading && data?.results !== null
                ? "hover:bg-green-700"
                : "opacity-60 cursor-not-allowed"
            }}`}
            type="submit"
            disabled={
              !isValid || isSubmitting || isLoading || data?.results === null
            }
          >
            NEXT
          </button>
        </form>
      </div>
    </Layout>
  );
}
