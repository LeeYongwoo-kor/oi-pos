import React, { ReactNode } from "react";

type ModalProps = {
  children: ReactNode;
  width?: number;
  height?: number;
};

function Modal({ children, width, height }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div
        className={`relative bg-slate-100 container mx-auto overflow-hidden rounded-md shadow-lg`}
        style={{
          width: `${width || 56}rem`,
          maxWidth: `${width || 56}rem`,
          height: `${height || 52}rem`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default React.memo(Modal);
