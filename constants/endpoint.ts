const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION;
const API_BASE_ENDPOINT = `${API_BASE_URL}/${API_VERSION}`;

export const OPEN_AI_IMAGE_ENDPOINT = {
  BASE: `${API_BASE_ENDPOINT}/open-ai-images`,
} as const;

export const PAYMENT_ENDPOINT = {
  BASE: `${API_BASE_ENDPOINT}/payments`,
  VERIFY: `${API_BASE_ENDPOINT}/payments/verify`,
} as const;

export const RESTAURANT_ENDPOINT = {
  BASE: `${API_BASE_ENDPOINT}/restaurants`,
  INFO: `${API_BASE_ENDPOINT}/restaurants/infos`,
  TABLE: `${API_BASE_ENDPOINT}/restaurants/tables`,
  CHECK_PHONE_NUMBER: `${API_BASE_ENDPOINT}/restaurants/check-phone-number`,
  MENU_CATEGORY: (restaurantId: string) =>
    `${API_BASE_ENDPOINT}/restaurants/${restaurantId}/menu-categories` as const,
  DEMO_MENU_CATEGORY: (restaurantId: string) =>
    `${API_BASE_ENDPOINT}/restaurants/${restaurantId}/demo/menu-categories`,
} as const;

export const ME_ENDPOINT = {
  USER: `${API_BASE_ENDPOINT}/me/users`,
  RESTAURANT: `${API_BASE_ENDPOINT}/me/restaurants`,
} as const;

export const SUBSCRIPTION_ENDPOINT = {
  BASE: `${API_BASE_ENDPOINT}/subscriptions`,
} as const;

export const EMAIL_ENDPOINT = {
  SEND_INVOICE: `${API_BASE_ENDPOINT}/emails/send-invoice`,
} as const;

export const PLAN_ENDPOINT = {
  BASE: `${API_BASE_ENDPOINT}/plans`,
} as const;
