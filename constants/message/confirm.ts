export const CONFIRM_DIALOG_MESSAGE = {
  UPDATE_INFO: {
    TITLE: "店舗情報の更新",
    MESSAGE: "変更された情報があります。変更内容を保存しますか？",
    CONFIRM_TEXT: "保存する",
    CANCEL_TEXT: "保存しない",
  },
  DISCARD_INPUT: {
    TITLE: "入力情報の破棄",
    MESSAGE: "入力情報を破棄しますか？",
    CONFIRM_TEXT: "破棄する",
    CANCEL_TEXT: "破棄しない",
  },
  DELETE_CATEGORY: {
    TITLE: "メニューカテゴリの削除",
    MESSAGE: "このメニューカテゴリを削除しますか？",
    CONFIRM_TEXT: "削除する",
    CANCEL_TEXT: "削除しない",
  },
  DELETE_CATEGORY_OPTION: {
    TITLE: "メニューカテゴリオプションの削除",
    MESSAGE:
      "このメニューカテゴリオプションは既に登録されています。本当に削除しますか？",
    CONFIRM_TEXT: "削除する",
    CANCEL_TEXT: "削除しない",
  },
  DELETE_MENU_OPTION: {
    TITLE: "メニューオプションの削除",
    MESSAGE:
      "このメニューオプションは既に登録されています。本当に削除しますか？",
    CONFIRM_TEXT: "削除する",
    CANCEL_TEXT: "削除しない",
  },
  PAYMENT_ORDER: {
    TITLE: "注文の会計",
    MESSAGE: "注文を終了し、お会計をこのまま行いますか？",
    CONFIRM_TEXT: "会計する",
    CANCEL_TEXT: "会計しない",
  },
  CHANGE_ORDER_STATUS: {
    TITLE: "注文ステータスの変更",
    MESSAGE: "注文ステータスを変更しますか？",
    CONFIRM_TEXT: "変更する",
    CANCEL_TEXT: "戻る",
  },
  CANCEL_ORDER_STATUS: {
    TITLE: "注文のキャンセル",
    MESSAGE: "注文をキャンセルしますか？ キャンセルすると、もとに戻せません",
    CONFIRM_TEXT: "キャンセル",
    CANCEL_TEXT: "戻る",
  },
  CHANGE_TABLE_UNAVAILABLE: {
    TITLE: "テーブルの状態変更",
    MESSAGE: "テーブルを{0}に変更しますか？",
    CONFIRM_TEXT: "する",
    CANCEL_TEXT: "戻る",
  },
  LOGOUT: {
    TITLE: "ログアウトの確認",
    MESSAGE: "ログアウトしま～す。よろしいでしょうか？",
    CONFIRM_TEXT: "ログアウト",
    CANCEL_TEXT: "キャンセル",
  },
} as const;
