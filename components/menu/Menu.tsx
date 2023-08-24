import { ME_ENDPOINT } from "@/constants/endpoint";
import { IRestaurant } from "@/database";
import useCategories from "@/hooks/fetch/useCategories";
import { useToast } from "@/hooks/useToast";
import { mobileState } from "@/recoil/state/menuState";
import { useEffect } from "react";
import { useRecoilValue } from "recoil";
import useSWR from "swr";
import Loader from "../Loader";
import Category from "./Category";
import MainArea from "./MainArea";
import MenuEdit from "./MenuEdit";
import MenuHeader from "./MenuHeader";
import MenuToggleButton from "./MenuToggleButton";
import SubCategory from "./SubCategory";
import CategoryEdit from "./CategoryEdit";

export default function Menu() {
  const {
    data: restaurantInfo,
    error: restaurantInfoErr,
    isValidating: restaurantInfoLoading,
  } = useSWR<IRestaurant>(ME_ENDPOINT.RESTAURANT);
  const { categoryLoading } = useCategories(restaurantInfo);
  const { addToast } = useToast();
  const isMobile = useRecoilValue(mobileState);
  const sizeClass = isMobile ? "max-w-xl" : "max-w-4xl";

  useEffect(() => {
    if (restaurantInfoErr) {
      addToast("error", restaurantInfoErr.message);
    }
  }, [restaurantInfoErr]);

  return (
    <div
      className={`relative bg-slate-100 font-archivo [&>*:first-child]:bg-slate-700 container mx-auto h-[52rem] overflow-hidden select-none ${sizeClass}`}
    >
      <MenuToggleButton />
      {(restaurantInfoLoading || categoryLoading) && <Loader />}
      <div className="relative h-full max-h-full p-4 overflow-hidden">
        <MenuHeader />
        <Category />
        <SubCategory />
        <MainArea />
        <MenuEdit />
        <CategoryEdit />
      </div>
    </div>
  );
}
