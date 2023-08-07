export const ToastKind = {
  PRESERVE: "preserve",
  ERROR: "error",
  SUCCESS: "success",
  INFO: "info",
} as const;

export const TOAST_MESSAGE = {
  INFO: {
    UPDATE_SUCCESS: "店舗情報を正常に更新しました",
    REGISTRATION_SUCCESS: "店舗情報を正常に登録しました",
  },
  REGISTERATION: {
    SUCCESS: "You have successfully registered!",
  },
} as const;
