import { IRestaurant } from "@/database";
import { editingState } from "@/recoil/state/menuState";
import { showOrderHistoryState } from "@/recoil/state/orderState";
import {
  faBellConcierge,
  faClockRotateLeft,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { Role } from "./Menu";

type MenuHeaderProps = {
  restaurantInfo: IRestaurant | undefined;
  role: Role;
};

export default function MenuHeader({ restaurantInfo, role }: MenuHeaderProps) {
  const isEditing = useRecoilValue(editingState);
  const openOrderHistory = useSetRecoilState(showOrderHistoryState);
  return (
    <header className="flex items-center justify-between pt-3 pb-6">
      <button className="p-2 transition-transform duration-150 transform bg-red-600 rounded-xl group hover:scale-[1.15]">
        <FontAwesomeIcon
          className="text-white group-hover:text-yellow-300 group-hover:animate-ring"
          size="lg"
          icon={faBellConcierge}
        />
      </button>
      <div className="absolute flex items-center space-x-3 transform -translate-x-1/2 left-1/2">
        {restaurantInfo?.logoUrl ? (
          <Image
            src="/images/logo/oi-pos.jpg"
            alt="Oi-POS Logo"
            draggable={false}
            width={64}
            height={64}
            className="object-cover rounded-full"
          />
        ) : (
          <>
            {isEditing && (
              <div className="flex items-center justify-center w-16 h-16 rounded-full cursor-pointer bg-slate-200 hover:bg-slate-300">
                <FontAwesomeIcon
                  className="text-slate-700"
                  icon={faImage}
                  size="xl"
                />
              </div>
            )}
          </>
        )}
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">
            {restaurantInfo?.name}
          </h1>
          <h2 className="text-base font-medium">{restaurantInfo?.branch}</h2>
        </div>
      </div>
      {role === "user" && (
        <button
          onClick={() => openOrderHistory(true)}
          className="p-2 transition-transform duration-150 transform bg-red-600 rounded-xl group hover:scale-[1.15]"
        >
          <FontAwesomeIcon
            className="text-white group-hover:animate-spin"
            size="lg"
            icon={faClockRotateLeft}
          />
        </button>
      )}
    </header>
  );
}
