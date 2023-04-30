import { ReactNode, useState } from "react";
import Alarm from "./Alarm";
import NavigationBar from "./NavigationBar";

export default function Layout({ children }: { children: ReactNode }) {
  const [isAlarmVisible, setIsAlarmVisible] = useState(true);

  const toggleAlarmVisibility = () => {
    setIsAlarmVisible(!isAlarmVisible);
  };

  return (
    <div className="bg-gray-100 ">
      <NavigationBar />
      <div className="flex min-h-screen">
        <main className="flex-grow px-4 pt-16">{children}</main>
        {isAlarmVisible && (
          <div className="w-64">
            <Alarm onToggle={toggleAlarmVisibility} />
          </div>
        )}
        {!isAlarmVisible && (
          <button
            onClick={toggleAlarmVisibility}
            className="fixed right-0 p-2 bg-white border border-gray-300 shadow-md top-20 rounded-l-md"
          >
            &laquo;
          </button>
        )}
      </div>
    </div>
  );
}
