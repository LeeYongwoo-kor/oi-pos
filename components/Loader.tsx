import { faGear } from "@fortawesome/free-solid-svg-icons/faGear";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

function Loader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <FontAwesomeIcon size="3x" icon={faGear} spin />
      <span className="ml-2 font-medium">Loading...</span>
    </div>
  );
}

export default React.memo(Loader);
