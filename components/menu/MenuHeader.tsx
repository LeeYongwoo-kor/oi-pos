import { faBars, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";

export default function MenuHeader() {
  return (
    <header className="flex items-center justify-between p-4">
      <button className="p-2">
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      <div className="absolute flex items-center space-x-2 transform -translate-x-1/2 left-1/2">
        <Image
          src="/logo/yoshi.jpg"
          alt="Yoshi Logo"
          draggable={false}
          width={56}
          height={56}
          className="object-cover rounded-full"
        />
        <div>
          <h1 className="text-xl font-bold">POS System</h1>
          <h2 className="text-sm font-medium">Tokyo Branch</h2>
        </div>
      </div>
      <button className="p-2">
        <FontAwesomeIcon icon={faBars} />
      </button>
    </header>
  );
}
