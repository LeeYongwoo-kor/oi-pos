import { ReactNode, useEffect, useState } from "react";
import Alarm from "./Alarm";
import NavigationBar from "./NavigationBar";
import { useSession } from "next-auth/react";

export default function Layout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [isAllInfoRegistered, setIsAllInfoRegistered] = useState(false);
  const [isAlarmVisible, setIsAlarmVisible] = useState(false);

  useEffect(() => {
    if (status === "loading") {
      return;
    }
    if (session?.isAllInfoRegistered) {
      setIsAllInfoRegistered(true);
      setIsAlarmVisible(true);
    }
  }, [session?.isAllInfoRegistered, status]);

  return (
    <div className="bg-gray-100 ">
      <NavigationBar isAllInfoRegistered={isAllInfoRegistered} />
      <div className="flex min-h-screen">
        <main className={`flex-grow px-4 pt-16 ${isAlarmVisible && "mr-80"}`}>
          {children}
        </main>
        {isAlarmVisible && session?.restaurantId && (
          <Alarm
            restaurantId={session.restaurantId}
            onToggle={() => setIsAlarmVisible(false)}
          />
        )}
        {!isAlarmVisible && (
          <button
            onClick={() => setIsAlarmVisible(true)}
            className="fixed p-2 bg-white border border-gray-300 shadow-md hover:bg-gray-100 -right-1 top-16 rounded-l-md"
          >
            &laquo;
          </button>
        )}
      </div>
    </div>
  );
}
