import {
  editingState,
  menuOpenState,
  mobileState,
} from "@/recoil/state/menuState";
import {
  faMobileAlt,
  faTabletAlt,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRecoilState, useSetRecoilState } from "recoil";

export default function MenuToggleButton() {
  const [isEditing, setIsEditing] = useRecoilState(editingState);
  const [isMobile, setIsMobile] = useRecoilState(mobileState);
  const setIsMenuOpen = useSetRecoilState(menuOpenState);
  return (
    <div className="flex items-center justify-between w-full p-4 text-white">
      <div className="space-x-3">
        <span className="font-semibold">Edit</span>
        <div className="relative inline-block w-10 align-middle cursor-pointer select-none">
          <input
            type="checkbox"
            name="isEditing"
            id="isEditing"
            onChange={() => setIsEditing(!isEditing)}
            className="hidden"
          />
          <label
            htmlFor="isEditing"
            className={`block h-5 overflow-hidden bg-gray-300 transform transition-colors rounded-full cursor-pointer toggle-label ${
              isEditing ? "bg-green-200" : "bg-blue-200"
            }`}
          >
            <span
              className={`block h-5 w-5 rounded-full shadow transform transition-transform ${
                isEditing
                  ? "translate-x-0 bg-green-500"
                  : "translate-x-full bg-blue-500"
              } ease-in-out duration-200`}
            ></span>
          </label>
        </div>
        <span className="font-semibold">Preview</span>
      </div>
      <div className="flex w-32">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMobile(true)}
            className={`flex items-center justify-center hover:bg-green-500 w-8 p-2 transition duration-150 ease-in-out rounded-full cursor-pointer ${
              isMobile ? "bg-green-500 text-white" : "bg-gray-300 text-black"
            }`}
          >
            <FontAwesomeIcon icon={faMobileAlt} />
          </button>
          <button
            onClick={() => setIsMobile(false)}
            className={`flex items-center justify-center w-8 p-2 hover:bg-green-500 transition duration-150 ease-in-out rounded-full cursor-pointer ${
              !isMobile ? "bg-green-500 text-white" : "bg-gray-300 text-black"
            }`}
          >
            <FontAwesomeIcon icon={faTabletAlt} />
          </button>
        </div>
        <button
          onClick={() => setIsMenuOpen(false)}
          className="flex items-center justify-center w-8 ml-auto text-white bg-red-500 rounded-full aspect-square hover:bg-red-600"
        >
          <FontAwesomeIcon icon={faXmark} size="1x" />
        </button>
      </div>
    </div>
  );
}
