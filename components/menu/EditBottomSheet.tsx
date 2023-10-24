import { EditFormAction, IActiveTab } from "@/reducers/menu/editFormReducer";
import React, { Dispatch, ReactNode } from "react";

type EditBottomSheetProps = {
  isVisible: boolean;
  handleCloseEdit: () => void;
  activeTab: IActiveTab;
  dispatch: Dispatch<EditFormAction>;
  essentialCondition: boolean;
  optionalCondition: boolean;
  children: ReactNode;
};

function EditBottomSheet({
  isVisible,
  handleCloseEdit,
  activeTab,
  dispatch,
  essentialCondition,
  optionalCondition,
  children,
}: EditBottomSheetProps) {
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
              onClick={handleCloseEdit}
              className="absolute z-10 p-2 text-sm text-black bg-gray-200 border-4 border-white rounded-full hover:bg-gray-300"
            >
              Back
            </button>
            <div className="absolute z-10 right-0 flex space-x-0.5 bg-white -top-0">
              <button
                onClick={() => dispatch({ type: "ACTIVE_TAP_ESSENTIAL" })}
                className={`px-4 py-2 ${
                  activeTab === "essential"
                    ? "font-semibold"
                    : `${
                        essentialCondition
                          ? "bg-red-200 hover:bg-red-300"
                          : "bg-gray-200 hover:bg-gray-300"
                      } shadow-[inset_1px_-1px_2px_rgba(0,0,0,0.2)]`
                } rounded-l`}
              >
                Essential
              </button>
              <button
                onClick={() => dispatch({ type: "ACTIVE_TAP_OPTIONAL" })}
                className={`px-4 py-2 ${
                  activeTab === "optional"
                    ? "font-semibold"
                    : `${
                        optionalCondition
                          ? "bg-red-200 hover:bg-red-300"
                          : "bg-gray-200 hover:bg-gray-300"
                      } shadow-[inset_1px_-1px_2px_rgba(0,0,0,0.2)]`
                } rounded-r`}
              >
                Optional
              </button>
            </div>
          </div>
          {children}
        </div>
      )}
    </div>
  );
}

export default React.memo(EditBottomSheet);
