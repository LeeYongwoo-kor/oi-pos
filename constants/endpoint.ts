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
  CHECK_PHONE_NUMBER: `${API_BASE_ENDPOINT}/restaurants/check-phone-number`,
  RESTAURANT_INFO_BY_ID: (restaurantId: string) =>
    `${API_BASE_ENDPOINT}/restaurants/${restaurantId}` as const,
  DEMO_MENU_CATEGORY: (restaurantId: string) =>
    `${API_BASE_ENDPOINT}/restaurants/${restaurantId}/demo/menu-categories` as const,
} as const;

export const RESTAURANT_ORDER_ENDPOINT = {
  ORDER_REQUEST: (restaurantId: string) =>
    `${API_BASE_ENDPOINT}/restaurants/${restaurantId}/orders/requests` as const,
};

export const RESTAURANT_MENU_ENDPOINT = {
  MENU_ITEM: (restaurantId: string) =>
    `${API_BASE_ENDPOINT}/restaurants/${restaurantId}/menus/items` as const,
  MENU_CATEGORY: (restaurantId: string) =>
    `${API_BASE_ENDPOINT}/restaurants/${restaurantId}/menus/categories` as const,
  MENU_SUB_CATEGORY: (restaurantId: string) =>
    `${API_BASE_ENDPOINT}/restaurants/${restaurantId}/menus/sub-categories` as const,
} as const;

export const RESTAURANT_TABLE_ENDPOINT = {
  BASE: `${API_BASE_ENDPOINT}/restaurants/tables`,
  TABLE_ID: (restaurantTableId: string) =>
    `${API_BASE_ENDPOINT}/restaurants/tables/${restaurantTableId}` as const,
  ORDER_REQUEST: (restaurantTableId: string, orderId: string) =>
    `${API_BASE_ENDPOINT}/restaurants/tables/${restaurantTableId}/orders/${orderId}/requests` as const,
  ORDER_ITEM: (restaurantTableId: string, orderId: string) =>
    `${API_BASE_ENDPOINT}/restaurants/tables/${restaurantTableId}/orders/${orderId}/items` as const,
} as const;

export const ORDER_ENDPOINT = {
  BASE: `${API_BASE_ENDPOINT}/orders`,
  ORDER: (orderId: string) => `${API_BASE_ENDPOINT}/orders/${orderId}` as const,
} as const;

export const CART_ENDPOINT = {
  MENU_ITEM: `${API_BASE_ENDPOINT}/cart/menu-items`,
} as const;

export const ME_ENDPOINT = {
  USER: `${API_BASE_ENDPOINT}/me/users`,
  RESTAURANT: `${API_BASE_ENDPOINT}/me/restaurants`,
  // ORDER_REQUEST: `${API_BASE_ENDPOINT}/me/restaurants/order-requests`,
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
