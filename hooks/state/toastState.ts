import { atom } from "recoil";
import { ToastType } from "@/components/ui/Toast";

export const toastState = atom<ToastType[]>({
  key: "toastState",
  default: [],
});
