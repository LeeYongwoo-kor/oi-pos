import { IMenuCategory, IMenuItem } from "@/database";
import useLoading from "@/hooks/context/useLoading";
import React from "react";

type EditBottomSheetFooterProps = {
  previousData: IMenuItem | IMenuCategory | null | undefined;
  handleDelete: () => void;
  handleSave: () => void;
  handleCloseEdit: () => void;
  deleteCondition: boolean;
  saveCondition: boolean;
};

function EditBottomSheetFooter({
  previousData,
  handleDelete,
  handleSave,
  handleCloseEdit,
  deleteCondition,
  saveCondition,
}: EditBottomSheetFooterProps) {
  const withLoading = useLoading();

  return (
    <div
      className={`flex mt-3 ${previousData ? "justify-between" : "self-end"}`}
    >
      {previousData && (
        <button
          onClick={handleDelete}
          disabled={deleteCondition}
          className={`px-6 py-2 text-white transition duration-200 ${
            deleteCondition
              ? "cursor-not-allowed bg-red-400"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          Delete
        </button>
      )}
      <div className="space-x-2">
        <button
          onClick={handleCloseEdit}
          className="px-6 py-2 text-black transition duration-200 bg-gray-200 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={async (e) => {
            e.preventDefault();
            await withLoading(handleSave);
          }}
          disabled={saveCondition}
          className={`px-6 py-2 text-white transition duration-200  rounded ${
            saveCondition
              ? "cursor-not-allowed bg-green-400"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default React.memo(EditBottomSheetFooter);
