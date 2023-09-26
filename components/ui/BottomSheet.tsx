import React, { ReactNode } from "react";
import { SetterOrUpdater } from "recoil";

type BottomSheetProps = {
  handleState: [boolean, SetterOrUpdater<boolean>];
  children: ReactNode;
};

function BottomSheet({
  handleState: [isOpen, setIsOpen],
  children,
}: BottomSheetProps) {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 transform transition-transform duration-300 ease-in-out ${
        isOpen ? "z-30" : "z-0"
      }`}
      style={{
        transform: `translateY(${isOpen ? "0%" : "100%"})`,
      }}
    >
      {isOpen && (
        <div className="flex flex-col max-h-[95vh] p-4 rounded-t-[2rem] bg-slate-700">
          <div className="flex justify-between mb-5 sm:mb-4">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-1 text-lg font-semibold text-black bg-gray-200 border-2 border-white rounded-full hover:bg-gray-300"
            >
              Back
            </button>
          </div>
          {children}
        </div>
      )}
    </div>
  );
}

export default React.memo(BottomSheet);
