import { IRestaurant } from "@/database";
import useCategories from "@/hooks/fetch/useCategories";
import { cartItemState, showCartItemState } from "@/recoil/state/cartItemState";
import { editingState } from "@/recoil/state/menuState";
import { getCartStorage } from "@/utils/menu/cartItemStorage";
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
import { showOrderHistoryState } from "@/recoil/state/orderState";

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

const OrderHistory = dynamic(() => import("../order/OrderHistory"), {
  loading: () => <Loader />,
  ssr: false,
});

export type Role = "owner" | "user";

type MenuProps = {
  restaurantInfo: IRestaurant | undefined;
  role: Role;
};

export default function Menu({ restaurantInfo, role }: MenuProps) {
  const { categoryInfo, categoryLoading } = useCategories(restaurantInfo);
  const [cartItems, setCartItems] = useRecoilState(cartItemState);
  const showCartItem = useRecoilValue(showCartItemState);
  const showOrderHistory = useRecoilValue(showOrderHistoryState);
  const setEditingState = useSetRecoilState(editingState);

  console.log("categoryInfo", categoryInfo);

  useEffect(() => {
    const initialCartItems = getCartStorage();
    setCartItems(initialCartItems);
  }, []);

  useEffect(() => {
    if (role === "user") {
      setEditingState(false);
    }
  }, [role]);

  return (
    <>
      {role === "owner" && <MenuToggleButton />}
      <div className="relative h-full max-h-full p-4 overflow-hidden font-archivo">
        {categoryLoading && <LoadingOverlay />}
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
        {cartItems.length > 0 && showCartItem && (
          <CartItem restaurantId={restaurantInfo?.id} />
        )}
        {showOrderHistory && <OrderHistory />}
      </div>
      {/* Cart Icon */}
      {cartItems.length > 0 && (
        <CartItemIcon cartItemCount={cartItems.length} />
      )}
    </>
  );
}
