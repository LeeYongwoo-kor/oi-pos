import { RESTAURANT_ENDPOINT } from "@/constants/endpoint";
import { IMenuCategory, IRestaurant } from "@/database";
import { categoriesState } from "@/recoil/state/menuState";
import { useEffect } from "react";
import { useSetRecoilState } from "recoil";
import useSWR from "swr";
import { useToast } from "../useToast";
import { ApiError } from "@/lib/shared/error/ApiError";

export default function useCategories(
  restaurantInfo: IRestaurant | undefined | null
) {
  const { addToast } = useToast();
  const setCategories = useSetRecoilState(categoriesState);
  const { data, error, isValidating } = useSWR<IMenuCategory[]>(
    restaurantInfo
      ? RESTAURANT_ENDPOINT.MENU_CATEGORY(restaurantInfo?.id)
      : null
  );

  useEffect(() => {
    if (data) {
      setCategories(data);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      addToast("error", error.message);
      if (error instanceof ApiError && error.statusCode === 404) {
        setCategories([]);
      }
    }
  }, [error, addToast]);

  return {
    categoryInfo: data,
    categoryError: error,
    categoryLoading: isValidating,
  };
}
