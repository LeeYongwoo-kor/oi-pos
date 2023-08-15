import { mobileState } from "@/recoil/state/menuState";
import { useRecoilValue } from "recoil";
import Category from "./Category";
import MainArea from "./MainArea";
import MenuHeader from "./MenuHeader";
import MenuToggleButton from "./MenuToggleButton";
import SubCategory from "./SubCategory";

export default function Menu() {
  const isMobile = useRecoilValue(mobileState);
  const sizeClass = isMobile ? "max-w-xl" : "max-w-4xl";
  return (
    <div
      className={`bg-slate-100 [&>*:first-child]:bg-slate-700 container mx-auto h-[52rem] select-none ${sizeClass}`}
    >
      <MenuToggleButton />
      <div className="p-4">
        <MenuHeader />
        <Category />
        <SubCategory />
        <MainArea />
      </div>
    </div>
  );
}
