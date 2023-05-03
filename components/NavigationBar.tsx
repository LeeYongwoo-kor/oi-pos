import useConfirm from "@/hooks/useConfirm";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/router";

export default function NavigationBar() {
  const router = useRouter();
  const showConfirm = useConfirm();

  const openConfirm = () => {
    showConfirm({
      title: "ログアウト",
      message: "ログアウトしま～す。よろしいでしょうか？",
      onConfirm: () => signOut(),
    });
  };

  const handleSettings = () => {
    // Redirect to settings page, for example
    router.push("/settings");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-10 h-16 bg-white shadow-md">
      <div className="container flex items-center justify-between h-full px-4 mx-auto">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Image
            src="/logo/yoshi.jpg"
            alt="Yoshi Logo"
            width={64}
            height={64}
          />
        </div>

        {/* Navigation menu */}
        <nav className="hidden space-x-10 md:flex">
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
        </nav>

        {/* Settings and logout buttons */}
        <div className="flex items-center space-x-6">
          <button
            onClick={handleSettings}
            className="text-gray-600 hover:text-gray-800"
          >
            Settings
          </button>
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
