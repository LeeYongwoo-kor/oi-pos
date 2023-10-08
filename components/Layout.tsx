import { showAlarmState } from "@/recoil/state/alarmState";
import { allInfoRegisteredState } from "@/recoil/state/infoState";
import { useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { useRecoilState } from "recoil";
import Alarm from "./Alarm";
import NavigationBar from "./NavigationBar";

export default function Layout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [isAllInfoRegistered, setIsAllInfoRegistered] = useRecoilState(
    allInfoRegisteredState
  );
  const [isAlarmVisible, setIsAlarmVisible] = useRecoilState(showAlarmState);

  useEffect(() => {
    if (session?.isAllInfoRegistered && status === "authenticated") {
      setIsAllInfoRegistered(true);
    }
  }, [session?.isAllInfoRegistered, status]);

  return (
    <div className="bg-gray-100 ">
      <NavigationBar />
      <div className="flex min-h-screen">
        <main
          className={`flex-grow px-4 pt-16 ${
            isAllInfoRegistered && isAlarmVisible && "mr-80"
          }`}
        >
          {children}
        </main>
        {isAllInfoRegistered && session?.restaurantId && (
          <Alarm
            restaurantId={session.restaurantId}
            onToggle={() => setIsAlarmVisible(false)}
          />
        )}
        {isAllInfoRegistered && !isAlarmVisible && (
          <button
            onClick={() => setIsAlarmVisible(true)}
            className="fixed p-2 bg-white border shadow-md border-slate-300 hover:bg-slate-50 -right-1 top-16 rounded-l-md"
          >
            &laquo;
          </button>
        )}
      </div>
    </div>
  );
}
