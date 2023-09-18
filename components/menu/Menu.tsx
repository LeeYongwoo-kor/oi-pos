import { IRestaurant } from "@/database";
import useCategories from "@/hooks/fetch/useCategories";
import { cartItemState } from "@/recoil/state/cartItemState";
import {
  editingState,
  mobileState,
  showCartItemState,
} from "@/recoil/state/menuState";
import { getCartItems } from "@/utils/menu/cartItemStorage";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import Loader from "../Loader";
import LoadingOverlay from "../LoadingOverlay";
import CartItemIcon from "./CartItemIcon";
import Category from "./Category";
import MenuHeader from "./MenuHeader";
import MenuItemArea from "./MenuItemArea";
import MenuToggleButton from "./MenuToggleButton";
import SubCategory from "./SubCategory";

const CategoryEdit = dynamic(() => import("./CategoryEdit"), {
  loading: () => <Loader />,
  ssr: false,
});

const MenuEdit = dynamic(() => import("./MenuEdit"), {
  loading: () => <Loader />,
  ssr: false,
});

const MenuDetail = dynamic(() => import("./MenuDetail"), {
  loading: () => <Loader />,
  ssr: false,
});

const CartItem = dynamic(() => import("./CartItem"), {
  loading: () => <Loader />,
  ssr: false,
});

type Role = "owner" | "user";

type MenuProps = {
  restaurantInfo: IRestaurant | undefined;
  role: Role;
};

export default function Menu({ restaurantInfo, role }: MenuProps) {
  const { categoryInfo, categoryLoading } = useCategories(restaurantInfo);
  const [cartItems, setCartItems] = useRecoilState(cartItemState);
  const showCartItem = useRecoilValue(showCartItemState);
  const setEditingState = useSetRecoilState(editingState);
  const isMobile = useRecoilValue(mobileState);
  const sizeClass = isMobile ? "max-w-xl" : "max-w-4xl";

  console.log("categoryInfo", categoryInfo);

  useEffect(() => {
    const initialCartItems = getCartItems();
    setCartItems(initialCartItems);
  }, []);

  useEffect(() => {
    if (role === "user") {
      setEditingState(false);
    }
  }, [role]);

  return (
    <div
      className={`relative bg-slate-100 font-archivo container mx-auto h-[52rem] overflow-hidden select-none ${sizeClass}`}
    >
      {role === "owner" && <MenuToggleButton />}
      {categoryLoading && <LoadingOverlay />}
      <div className="relative h-full max-h-full p-4 overflow-hidden">
        <MenuHeader restaurantInfo={restaurantInfo} />
        <Category />
        <SubCategory
          restaurantId={restaurantInfo?.id}
          categoryInfo={categoryInfo}
        />
        <MenuItemArea />
        <MenuEdit restaurantId={restaurantInfo?.id} />
        <CategoryEdit restaurantId={restaurantInfo?.id} />
        <MenuDetail />
        {cartItems.length > 0 && showCartItem && <CartItem />}
      </div>
      {/* Cart Icon */}
      {cartItems.length > 0 && (
        <CartItemIcon cartItemCount={cartItems.length} />
      )}
    </div>
  );
}
