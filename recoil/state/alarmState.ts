import { atom } from "recoil";

export const showAlarmState = atom({
  key: "showAlarmState",
  default: false,
});

export const sortRequestedOrderState = atom({
  key: "sortRequestedOrderState",
  default: false,
});

export const tableTypeState = atom({
  key: "tableTypeState",
  default: "all",
});

export const tableNumberState = atom({
  key: "tableNumberState",
  default: "",
});
