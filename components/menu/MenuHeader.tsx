import { ME_ENDPOINT } from "@/constants/endpoint";
import { IRestaurant } from "@/database";
import {
  faArrowLeft,
  faBars,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import useSWR from "swr";
import Loader from "../Loader";
import { editingState } from "@/recoil/state/menuState";
import { useRecoilValue } from "recoil";

export default function MenuHeader() {
  const isEditing = useRecoilValue(editingState);
  const { data: restaurantInfo, isValidating: restaurantInfoLoading } =
    useSWR<IRestaurant>(ME_ENDPOINT.RESTAURANT, {
      revalidateOnFocus: false,
      revalidateOnMount: false,
    });

  return (
    <header className="flex items-center justify-between pt-3 pb-6">
      {restaurantInfoLoading && <Loader />}
      <button className="p-2">
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      <div className="absolute flex items-center space-x-3 transform -translate-x-1/2 left-1/2">
        {restaurantInfo?.logoUrl ? (
          <Image
            src="/logo/yoshi.jpg"
            alt="Yoshi Logo"
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
          <h1 className="text-2xl font-bold">{restaurantInfo?.name}</h1>
          <h2 className="text-base font-medium">{restaurantInfo?.branch}</h2>
        </div>
      </div>
      <button className="p-2">
        <FontAwesomeIcon icon={faBars} />
      </button>
    </header>
  );
}
