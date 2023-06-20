import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import useSubmit from "@/hooks/useSubmit";
import { useToast } from "@/hooks/useToast";
import { StatusBar } from "@/components/StatusBar";

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
  restaurantName: yup
    .string()
    .required("Restaurant Name is required")
    .max(30, "Restaurant Name should be at most 30 characters")
    .matches(/^\s*\w.*$/, "No special characters allowed"),
  branchName: yup
    .string()
    .required("Branch Name is required")
    .max(20, "Branch Name should be at most 20 characters")
    .matches(/^\s*\w.*$/, "No special characters allowed"),
  phone: yup.string().matches(/^0\d{9,10}$/, "Must be a valid phone number"),
  postCode: yup
    .string()
    .required("Post Code is required")
    .matches(/^\d{7}$/, "Must be a valid post code"),
  address: yup
    .string()
    .required("Address is required. Please input post code and click search"),
  restAddress: yup
    .string()
    .max(50, "Rest Address should be at most 50 characters")
    .matches(
      /^[a-zA-Z0-9\s,.'-]*$/,
      "No special characters allowed other than address characters"
    ),
});

export default function RestaurantInfo() {
  const {
    register,
    handleSubmit: formSubmit,
    setValue,
    watch,
    resetField,
    formState: { errors, isValid, touchedFields },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
  });
  const watchFields = watch();
  // const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchButtonEnabled, setSearchButtonEnabled] = useState(false);
  const { addToast } = useToast();
  const { mutate } = useSWRConfig();
  const { data, error } = useSWR<ZipcodeApiResponse>(
    isSearchButtonEnabled
      ? `https://zip-cloud.appspot.com/api/search?zipcode=${watchFields.postCode}`
      : null
  );

  const onSubmitCallback = async (formData: any) => {
    console.log(formData);
  };
  const { isSubmitting, handleSubmit } = useSubmit(onSubmitCallback);

  const handlePostCodeSearch = () => {
    if (!watchFields.postCode) return;
    resetField("address");
    mutate(
      `https://zip-cloud.appspot.com/api/search?zipcode=${watchFields.postCode}`
    );
  };

  useEffect(() => {
    setSearchButtonEnabled(!errors.postCode && !!watchFields.postCode);
  }, [errors.postCode, watchFields.postCode]);

  useEffect(() => {
    if (isSearchButtonEnabled) {
      if (data?.results === null) {
        addToast("error", "Post Code not found, Please try again");
        resetField("address");
      }
      if (data?.results && data.results.length > 0) {
        const addressResult = [
          data.results[0].address1,
          data.results[0].address2,
          data.results[0].address3,
        ].join(" ");
        setValue("address", addressResult);
      }
    }
  }, [data, setValue]);

  return (
    <Layout>
      <StatusBar
        steps={["Info", "Hours", "Tables", "Menus", "Complete"]}
        currentStep="Tables"
      />
      <div className="container px-4 py-8 mx-auto">
        <h1 className="mb-4 text-2xl font-semibold">
          Enter basic information about the restaurant
        </h1>
        <p className="mb-6">
          This page helps you enter basic information about your restaurant.
        </p>
        <form onSubmit={formSubmit(handleSubmit)}>
          <div className="mb-4">
            <label className="block mb-2">Restaurant Name</label>
            <input
              className={`w-full p-2 border ${
                errors.restaurantName
                  ? "border-red-500"
                  : touchedFields.restaurantName && watchFields.restaurantName
                  ? "border-green-500"
                  : "border-gray-400"
              } rounded`}
              type="text"
              {...register("restaurantName")}
            />
            {errors.restaurantName && (
              <span className="text-red-500">
                {errors.restaurantName?.message as string}
              </span>
            )}
          </div>
          <div className="mb-4">
            <label className="block mb-2">Branch Name</label>
            <input
              className={`w-full p-2 border ${
                errors.branchName
                  ? "border-red-500"
                  : touchedFields.branchName && watchFields.branchName
                  ? "border-green-500"
                  : "border-gray-400"
              } rounded`}
              type="text"
              {...register("branchName")}
            />
            {errors.branchName && (
              <span className="text-red-500">
                {errors.branchName?.message as string}
              </span>
            )}
          </div>
          <div className="mb-4">
            <label className="block mb-2">
              Restaurant Phone Number (Please omit the -)
            </label>
            <input
              className={`w-full p-2 border ${
                errors.phone
                  ? "border-red-500"
                  : touchedFields.phone && watchFields.phone
                  ? "border-green-500"
                  : "border-gray-400"
              } rounded`}
              type="tel"
              maxLength={11}
              {...register("phone")}
            />
            {errors.phone && (
              <span className="text-red-500">
                {errors.phone?.message as string}
              </span>
            )}
          </div>
          <label className="block mb-2">
            Japan Postal Code (Please omit the -)
          </label>
          <div className="flex items-center">
            <input
              className={`w-full p-2 border ${
                errors.postCode
                  ? "border-red-500"
                  : touchedFields.postCode && watchFields.postCode
                  ? "border-green-500"
                  : "border-gray-400"
              } rounded`}
              type="text"
              maxLength={7}
              {...register("postCode")}
            />
            <button
              className={`p-2 ml-2 text-white bg-blue-500 rounded ${
                isSearchButtonEnabled
                  ? "hover:bg-blue-700"
                  : "opacity-50 cursor-not-allowed"
              }`}
              type="button"
              onClick={handlePostCodeSearch}
              disabled={!isSearchButtonEnabled}
            >
              Search
            </button>
          </div>
          {errors.postCode && (
            <span className="text-red-500">
              {errors.postCode?.message as string}
            </span>
          )}
          <div className="mt-4 mb-4">
            <label className="block mb-2">Address</label>
            <input
              className={`w-full p-2 border ${
                errors.address
                  ? "border-red-500"
                  : touchedFields.address
                  ? "border-green-500"
                  : "border-gray-400"
              } rounded`}
              type="text"
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
            <label className="block mb-2">
              Rest of the Address (Not required)
            </label>
            <input
              className={`w-full p-2 border ${
                errors.restAddress ? "border-red-500" : "border-green-500"
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
              isValid && !isSubmitting
                ? "hover:bg-green-700"
                : "opacity-60 cursor-not-allowed"
            }}`}
            type="submit"
            disabled={!isValid || isSubmitting}
          >
            NEXT
          </button>
        </form>
      </div>
    </Layout>
  );
}
