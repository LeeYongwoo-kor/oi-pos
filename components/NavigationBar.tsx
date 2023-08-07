import { CONFIRM_DIALOG_MESSAGE } from "@/constants/message/confirm";
import { useConfirm } from "@/hooks/useConfirm";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useSWRConfig } from "swr";

type NavigationBarProps = {
  isAllInfoRegistered: boolean;
};

export default function NavigationBar({
  isAllInfoRegistered,
}: NavigationBarProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { showConfirm } = useConfirm();

  const openConfirm = () => {
    showConfirm({
      title: CONFIRM_DIALOG_MESSAGE.LOGOUT.TITLE,
      message: CONFIRM_DIALOG_MESSAGE.LOGOUT.MESSAGE,
      onConfirm: () => {
        // clear cache on logout
        mutate(() => true, undefined, { revalidate: false });
        signOut();
      },
    });
  };

  const handleSettings = () => {
    // Redirect to settings page, for example
    router.push("/settings");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-10 bg-white shadow-md h-14">
      <div className="container flex items-center justify-between h-full px-4 mx-auto">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Image
            src="/logo/yoshi.jpg"
            alt="Yoshi Logo"
            width={56}
            height={56}
          />
        </div>

        {/* Navigation menu */}
        <nav className="hidden space-x-10 md:flex">
          {isAllInfoRegistered && (
            <>
              <a href="#" className="text-gray-600 hover:text-gray-800">
                Orders
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-800">
                Tables
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-800">
                Menus
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-800">
                Restaurants
              </a>
            </>
          )}
        </nav>

        {/* Settings and logout buttons */}
        <div className="flex items-center space-x-6">
          {isAllInfoRegistered && (
            <button
              onClick={handleSettings}
              className="text-gray-600 hover:text-gray-800"
            >
              Settings
            </button>
          )}
          <button
            onClick={openConfirm}
            className="text-gray-600 hover:text-gray-800"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
