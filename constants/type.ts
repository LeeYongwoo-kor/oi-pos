export const TableType = {
  TABLE: "TABLE",
  COUNTER: "COUNTER",
} as const;

export const UserRoleType = {
  ADMIN: "ADMIN",
  OWNER: "OWNER",
  STAFF: "STAFF",
} as const;

export const LocaleType = {
  en: "en",
  ja: "ja",
};

export type TableEnumType = keyof typeof TableType;
export type UserRoleEnumType = keyof typeof UserRoleType;
export type LocaleEnumType = keyof typeof LocaleType;
