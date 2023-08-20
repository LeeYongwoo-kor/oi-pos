import {
  editingState,
  mobileState,
  showEditState,
} from "@/recoil/state/menuState";
import {
  faCirclePlus,
  faPenToSquare,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useRecoilValue, useSetRecoilState } from "recoil";

export default function MainArea() {
  const isMobile = useRecoilValue(mobileState);
  const isEditing = useRecoilValue(editingState);
  const showEditMenu = useSetRecoilState(showEditState);
  const responsiveStyle = isMobile ? "grid-cols-2" : "grid-cols-3";
  const dishes = [
    {
      id: 1,
      name: "Beef Burger",
      price: 5.99,
      image: "/menus/yoshi-demo/Lunch/beef-burger.jpg",
    },
    {
      id: 2,
      name: "Tomato Pasta",
      price: 6.99,
      image: "/menus/yoshi-demo/Lunch/tomato-pasta.jpg",
    },
    {
      id: 3,
      name: "Beef Burger",
      price: 5.99,
      image: "/menus/yoshi-demo/Lunch/beef-burger.jpg",
    },
    {
      id: 4,
      name: "Tomato Pasta",
      price: 6.99,
      image: "/menus/yoshi-demo/Lunch/tomato-pasta.jpg",
    },
    {
      id: 5,
      name: "Beef Burger",
      price: 5.99,
      image: "/menus/yoshi-demo/Lunch/beef-burger.jpg",
    },
    {
      id: 6,
      name: "Tomato Pasta",
      price: 6.99,
      image: "/menus/yoshi-demo/Lunch/tomato-pasta.jpg",
    },
  ];
  const handleEditMenu = () => {
    if (!isEditing) {
      return;
    }
    showEditMenu(true);
  };

  return (
    <div
      className={`grid grid-cols-2 gap-3 overflow-y-scroll max-h-[30rem] scrollbar-hide ${responsiveStyle}`}
    >
      {dishes.map((dish) => (
        <div
          key={dish.id}
          className={`relative flex flex-col rounded-lg shadow-md ${
            isEditing ? "cursor-pointer hover-wrapper" : ""
          }`}
        >
          {isEditing && (
            <div className="hidden edit-icon">
              <button
                onClick={handleEditMenu}
                className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
              >
                <FontAwesomeIcon
                  className="text-white"
                  size="2x"
                  icon={faPenToSquare}
                />
              </button>
            </div>
          )}
          {isEditing && <div onClick={handleEditMenu} className="overlay" />}
          <div className="relative h-40">
            <Image
              src={`https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_DOMAIN}${dish.image}`}
              alt={dish.name}
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div className="flex justify-between">
            <div className="flex flex-col py-2 pl-2">
              <h3 className="text-xl font-semibold">{dish.name}</h3>
              <p className="text-base font-medium text-gray-500">
                ${dish.price}
              </p>
            </div>
            <div className="w-16 py-2 mr-1">
              <button className="w-full h-full text-white bg-red-500 rounded-full hover:bg-red-600">
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
          </div>
        </div>
      ))}
      {/* Add new dish button */}
      {isEditing && (
        <button
          onClick={handleEditMenu}
          className="flex flex-col items-center justify-center h-56 p-4 m-1 space-y-2 border-4 border-dotted hover:text-slate-500 text-slate-400 border-slate-300 hover:border-slate-400"
        >
          <FontAwesomeIcon size="2x" icon={faCirclePlus} />
          <span className="text-lg font-semibold">Add new dish</span>
        </button>
      )}
    </div>
  );
}
