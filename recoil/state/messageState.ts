import { UseMessageReturn } from "@/components/ui/Message";
import { atom } from "recoil";

export const messageState = atom<UseMessageReturn>({
  key: "messageState",
  default: {
    isOpen: false,
    title: "",
    message: "",
    type: "confirm",
    buttonType: "confirm",
    confirmText: "",
    cancelText: "",
    placeholder: "",
  },
});

export const messageLoadingState = atom<boolean>({
  key: "messageLoadingState",
  default: false,
});
