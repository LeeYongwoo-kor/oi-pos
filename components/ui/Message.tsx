import React from "react";

type MessageProps = {
  title: string;
  message: string;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const Message = ({
  title,
  message,
  isOpen,
  onConfirm,
  onCancel,
}: MessageProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="z-50 w-full max-w-md p-6 mx-auto bg-white rounded shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">{title}</h2>
        <p className="mb-6 text-gray-600">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default Message;
