import { faGear } from "@fortawesome/free-solid-svg-icons/faGear";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type LoaderProps = {
  color?: "white" | "black";
};

function Loader({ color }: LoaderProps) {
  return (
    <div
      className={`flex items-center select-none justify-center h-full text-${
        color || "black"
      }`}
    >
      <FontAwesomeIcon width={50} height={50} size="3x" icon={faGear} spin />
      <span className="ml-2 text-lg font-semibold">Loading...</span>
    </div>
  );
}

export default React.memo(Loader);
