import Layout from "@/components/Layout";
import { StatusBar } from "@/components/StatusBar";
import Menu from "@/components/menu/Menu";
import { RESTAURANT_SETUP_STEPS } from "@/constants/status";
import { menuOpenState } from "@/recoil/state/menuState";
import { useRecoilState } from "recoil";

export default function RestaurantsMenus() {
  const [isMenuOpen, setIsMenuOpen] = useRecoilState(menuOpenState);
  return (
    <Layout>
      <StatusBar steps={RESTAURANT_SETUP_STEPS} currentStep="Menus" />
      <div>
        <button
          onClick={() => setIsMenuOpen(true)}
          className="px-4 py-2 text-white transition duration-200 bg-blue-500 rounded hover:bg-blue-600"
        >
          Create And Edit Menus
        </button>
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
            <Menu />
          </div>
        )}
      </div>
    </Layout>
  );
}
