import { showCartItemState } from "@/recoil/state/cartItemState";
import { faCartShopping } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSetRecoilState } from "recoil";

type CartItemIconProps = {
  cartItemCount: number;
};

export default function CartItemIcon({ cartItemCount }: CartItemIconProps) {
  const openCartItem = useSetRecoilState(showCartItemState);

  return (
    <div
      onClick={() => openCartItem(true)}
      className="fixed z-10 -translate-x-1/2 bottom-3 opacity-70 left-1/2 sm:right-auto sm:left-12 hover:opacity-100"
    >
      <div className="relative">
        <button className="flex items-center justify-center w-12 h-12 text-white rounded-full bg-sky-500">
          <FontAwesomeIcon size="lg" icon={faCartShopping} />
        </button>
        <span className="absolute flex items-center justify-center w-6 h-6 text-xs text-white bg-red-600 rounded-full -top-1.5 -right-1.5">
          {cartItemCount}
        </span>
      </div>
    </div>
  );
}
