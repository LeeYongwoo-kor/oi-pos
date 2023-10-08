export const RESTAURANT_URL = {
  BASE: `/restaurants`,
  SETUP: {
    BASE: `/restaurants/setup`,
    INFO: `/restaurants/setup/info`,
    HOURS: `/restaurants/setup/hours`,
    TABLES: `/restaurants/setup/tables`,
    MENUS: `/restaurants/setup/menus`,
    COMPLETE: `/restaurants/setup/complete`,
  },
  ORDER: `/restaurants/orders`,
  TABLE: {
    MANAGE: {
      BASE: `/restaurants/tables/manage`,
      QR_CODE: `/restaurants/tables/manage/qr-codes`,
    },
  },
} as const;

export const AUTH_URL = {
  LOGIN: `/auth/signin`,
  LOGOUT: `/auth/signout`,
  VERIFY_REQUEST: `/auth/verify-request`,
} as const;

export const DASHBOARD_URL = {
  BASE: `/dashboard`,
} as const;

export const PLAN_URL = {
  BASE: `/plans`,
  REGISTER: `/plans/register`,
} as const;

export const AUTH_ERROR_URL = {
  BASE: `/errors`,
} as const;

export const ERROR_URL = {
  NOT_FOUND: `/404`,
  SERVER_ERROR: `/500`,
} as const;

export const ACCESS_URL = {
  BASE: `/access`,
} as const;

export const NEXT_JS_INTERNAL_PREFIX = `/_next`;
