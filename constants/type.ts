export const TableType = {
  TABLE: "TABLE",
  COUNTER: "COUNTER",
} as const;

export const UserRoleType = {
  ADMIN: "ADMIN",
  OWNER: "OWNER",
} as const;

export type TableEnumType = keyof typeof TableType;
export type UserRoleEnumType = keyof typeof UserRoleType;
