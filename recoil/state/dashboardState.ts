import { atom } from "recoil";

export const qrCodeOpenState = atom<boolean>({
  key: "qrCodeOpenState",
  default: false,
});
