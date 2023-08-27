import { mobileState, showMenuEditState } from "@/recoil/state/menuState";
import { MenuItemStatus } from "@prisma/client";
import { useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";

export default function MenuEdit() {
  const isVisible = useRecoilValue(showMenuEditState);
  const closeEditMenu = useSetRecoilState(showMenuEditState);
  const isMobile = useRecoilValue(mobileState);
  const [activeTab, setActiveTab] = useState("essential");
  const [menuItemStatus, setMenuItemStatus] = useState<MenuItemStatus>(
    MenuItemStatus.AVAILABLE
  );

  const handleCloseMenu = () => {
    closeEditMenu(false);
  };

  return (
    <div
      className={`absolute inset-0 top-4 transform transition-transform duration-300 ease-in-out ${
        isVisible ? "z-30" : "z-0"
      }`}
      style={{
        transform: `translateY(${isVisible ? "0%" : "100%"})`,
      }}
    >
      {isVisible && (
        <div className="flex flex-col overflow-y-scroll h-full max-h-[47rem] p-4 bg-white rounded-t-[2rem] scrollbar-hide">
          <div className="flex justify-between mb-12">
            <button
              onClick={handleCloseMenu}
              className="absolute p-2 text-sm text-black bg-gray-200 rounded-full hover:bg-gray-300"
            >
              Back
            </button>
            <div className="absolute right-0 flex space-x-0.5 bg-white -top-0">
              <button
                onClick={() => setActiveTab("essential")}
                className={`px-4 py-2 ${
                  activeTab === "essential"
                    ? "font-semibold"
                    : "bg-gray-200 hover:bg-gray-300 shadow-[inset_1px_-1px_2px_rgba(0,0,0,0.2)]"
                } rounded-l`}
              >
                Essential
              </button>
              <button
                onClick={() => setActiveTab("optional")}
                className={`px-4 py-2 ${
                  activeTab === "optional"
                    ? "font-semibold"
                    : "bg-gray-200 hover:bg-gray-300 shadow-[inset_1px_-1px_2px_rgba(0,0,0,0.2)]"
                } rounded-r`}
              >
                Optional
              </button>
            </div>
          </div>
          {activeTab === "essential" && (
            <div className="flex flex-col space-y-4">
              <input
                className={`p-2 border-b-2 ${isMobile ? "w-full" : "w-3/4"}`}
                type="text"
                placeholder="Enter menu name (example: Chicken Burger)"
              />
              <input
                className={`p-2 border-b-2 ${isMobile ? "w-full" : "w-3/4"}`}
                type="text"
                placeholder="Enter menu price (example: 990)"
              />
              <div className="flex justify-center space-x-2">
                <div className="flex flex-col items-center flex-1 p-2 border-2 rounded">
                  <div className="w-full h-64 bg-gray-200 rounded aspect-square" />
                  <button className="w-full py-2 mt-2 text-white transition bg-blue-500 rounded hover:bg-blue-600">
                    Upload Image
                  </button>
                </div>
                <div className="flex flex-col items-center flex-1 p-2 border-2 rounded">
                  <div className="w-full h-64 bg-gray-200 rounded aspect-square" />
                  <button className="w-full py-2 mt-2 text-white transition rounded bg-lime-500 hover:bg-lime-600">
                    Generate Image with AI
                  </button>
                </div>
              </div>
              <textarea
                className="w-full h-24 p-2 border-2 resize-none"
                placeholder="Enter description"
              />
              <div className="flex-wrap items-center">
                <label className="whitespace-nowrap">Sub-category:</label>
                <div className="w-full h-10 mt-2 bg-gray-200 border-b-2" />
              </div>
              <div className="self-end space-x-2">
                <button
                  onClick={handleCloseMenu}
                  className="px-6 py-2 text-black transition duration-200 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button className="px-6 py-2 text-white transition duration-200 bg-green-500 rounded hover:bg-green-600">
                  Save
                </button>
              </div>
            </div>
          )}
          {activeTab === "optional" && (
            <>
              <div className="flex-wrap mt-2 indent-2">
                <label className="">Menu Status:</label>
              </div>
              <div className="flex p-2 mt-2 border-2 rounded">
                <div className="flex flex-wrap space-x-2">
                  {Object.keys(MenuItemStatus).map((status, idx) => (
                    <label
                      key={idx}
                      className="flex items-center p-1 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="menuItemStatus"
                        value={status}
                        checked={menuItemStatus === status}
                        onChange={() =>
                          setMenuItemStatus(status as MenuItemStatus)
                        }
                        className="hidden"
                      />
                      <div
                        className={`flex items-center px-2 py-1 border-2 rounded ${
                          menuItemStatus === status
                            ? "border-blue-500"
                            : "border-gray-300 hover:border-blue-400"
                        }`}
                      >
                        <span
                          className={`block w-4 h-4 rounded-full ${
                            menuItemStatus === status
                              ? "bg-blue-500"
                              : "bg-gray-300"
                          }`}
                        ></span>
                        <span className="ml-2 text-sm">{status}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
