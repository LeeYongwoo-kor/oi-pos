export const PROMPT_DIALOG_MESSAGE = {
  REJECT_ORDER_REQUEST: {
    TITLE: "注文のキャンセル",
    MESSAGE: "注文を断る理由を入力してください。",
    PLACEHOLDER: "すみません。品切れのため、注文ができませんでした。",
    CONFIRM_TEXT: "送信する",
    CANCEL_TEXT: "送信しない",
  },
  BOOKING_TABLE: {
    TITLE: "テーブルの予約",
    MESSAGE: "代表者のお名前を入力してください。",
    PLACEHOLDER: "山本太郎",
    CONFIRM_TEXT: "予約する",
    CANCEL_TEXT: "予約しない",
  },
} as const;
