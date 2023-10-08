import { CONFIRM_DIALOG_MESSAGE } from "@/constants/message/confirm";
import { DASHBOARD_URL, PLAN_URL, RESTAURANT_URL } from "@/constants/url";
import { useAlert } from "@/hooks/useAlert";
import { useConfirm } from "@/hooks/useConfirm";
import { allInfoRegisteredState } from "@/recoil/state/infoState";
import { menuOpenState } from "@/recoil/state/menuState";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { useSWRConfig } from "swr";

export default function NavigationBar() {
  const isAllInfoRegistered = useRecoilValue(allInfoRegisteredState);
  const [isOpenMenu, setIsMenuOpen] = useRecoilState(menuOpenState);
  const { mutate } = useSWRConfig();
  const router = useRouter();
  const currentPage = router.pathname;
  const [showSubNav, setShowSubNav] = useState(false);
  const { showConfirm } = useConfirm();
  const { showAlert } = useAlert();

  const handleLogout = () => {
    showConfirm({
      title: CONFIRM_DIALOG_MESSAGE.LOGOUT.TITLE,
      message: CONFIRM_DIALOG_MESSAGE.LOGOUT.MESSAGE,
      confirmText: CONFIRM_DIALOG_MESSAGE.LOGOUT.CONFIRM_TEXT,
      cancelText: CONFIRM_DIALOG_MESSAGE.LOGOUT.CANCEL_TEXT,
      buttonType: "fatal",
      onConfirm: () => {
        // clear cache on logout
        mutate(() => true, undefined, { revalidate: false });
        signOut();
      },
    });
  };

  const handleAnalysis = () => {
    // TODO: Sales analysis page incomplete
    showAlert({
      title: "分析ページ",
      message: "現在、製作中です! ぜひお楽しみにしてください!",
      cancelText: "閉じる",
      buttonType: "confirm",
    });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-10 bg-white shadow-md h-14 font-archivo">
      <div className="container flex items-center justify-between h-full px-4 mx-auto">
        <nav className="flex items-center justify-center space-x-10 text-sm">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Image
              width={56}
              height={56}
              className="rounded-full"
              src="/images/logo/yoshi.jpg"
              alt="Yoshi Logo"
              draggable={false}
            />
          </div>
          {/* Navigation menu */}
          {isAllInfoRegistered && (
            <>
              <div>
                <Link
                  href={DASHBOARD_URL.BASE}
                  className={`px-3 py-1 font-semibold border shadow-inner text-slate-600 rounded-xl hover:bg-blue-100 ${
                    currentPage === DASHBOARD_URL.BASE
                      ? "bg-blue-200"
                      : "bg-white"
                  }`}
                >
                  Dashboard
                </Link>
              </div>
              <div>
                <button
                  onClick={() => setIsMenuOpen(true)}
                  className={`px-3 py-1 font-semibold border shadow-inner text-slate-600 rounded-xl hover:bg-blue-100 ${
                    isOpenMenu ? "bg-indigo-200" : "bg-white"
                  }`}
                >
                  MenuEdit
                </button>
              </div>
              <div
                className="relative cursor-pointer"
                onMouseEnter={() => setShowSubNav(true)}
                onMouseLeave={() => setShowSubNav(false)}
              >
                <div
                  className={`px-3 py-1 font-semibold border shadow-inner text-slate-600 rounded-xl hover:bg-blue-100 ${
                    currentPage.startsWith(RESTAURANT_URL.SETUP.BASE)
                      ? "bg-blue-200"
                      : "bg-white"
                  }`}
                >
                  RestaurantEdit
                </div>
                {/* Sub Navigation menu */}
                {showSubNav && (
                  <div className="absolute top-[100%] left-0">
                    <div className="w-48 py-2 mt-2 font-semibold bg-white border border-gray-300 rounded-lg shadow-lg">
                      <Link
                        className="block px-4 py-2 text-gray-800 hover:bg-blue-100"
                        href={RESTAURANT_URL.SETUP.INFO}
                      >
                        Info
                      </Link>
                      <Link
                        className="block px-4 py-2 text-gray-800 hover:bg-blue-100"
                        href={RESTAURANT_URL.SETUP.HOURS}
                      >
                        Hour
                      </Link>
                      <Link
                        className="block px-4 py-2 text-gray-800 hover:bg-blue-100"
                        href={RESTAURANT_URL.SETUP.TABLES}
                      >
                        Table
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Link
                  href={PLAN_URL.REGISTER}
                  className={`px-3 py-1 font-semibold border shadow-inner text-slate-600 rounded-xl hover:bg-blue-100 ${
                    currentPage === PLAN_URL.REGISTER
                      ? "bg-blue-200"
                      : "bg-white"
                  }`}
                >
                  PlanEdit
                </Link>
              </div>
              <div>
                <button
                  onClick={handleAnalysis}
                  className="px-3 py-1 font-semibold border shadow-inner text-slate-600 rounded-xl hover:bg-blue-100"
                >
                  Analysis
                </button>
              </div>
            </>
          )}
        </nav>
        {/* Logout */}
        <div className="flex items-center space-x-6 text-sm">
          <button
            onClick={handleLogout}
            className="px-3 py-1 font-semibold border shadow-inner text-slate-600 rounded-xl hover:bg-slate-200"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
