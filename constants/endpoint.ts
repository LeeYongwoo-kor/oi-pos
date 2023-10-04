const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION;
const API_BASE_ENDPOINT = `${API_BASE_URL}/${API_VERSION}`;

export const OWNER_ENDPOINT = {
  SUBSCRIPTION: `${API_BASE_ENDPOINT}/owner/subscriptions`,
  EMAIL: {
    SEND_INVOICE: `${API_BASE_ENDPOINT}/owner/emails/send-invoice`,
  } as const,
  OPEN_AI_IMAGE: `${API_BASE_ENDPOINT}/owner/open-ai-images`,
  PLAN: {
    BASE: `${API_BASE_ENDPOINT}/owner/plans`,
    PAYMENT: {
      CHECK_OUT: (orderId: string) =>
        `${API_BASE_ENDPOINT}/owner/plans/payments/${orderId}` as const,
      VERIFY: `${API_BASE_ENDPOINT}/owner/plans/payments/verify`,
    } as const,
  } as const,
  RESTAURANT: {
    BASE: (restaurantId: string | undefined) =>
      `${API_BASE_ENDPOINT}/owner/restaurants/${restaurantId}` as const,
    CHECK_PHONE_NUMBER: `${API_BASE_ENDPOINT}/owner/restaurants/check-phone-number`,
    MENU: {
      ITEM: (restaurantId: string) =>
        `${API_BASE_ENDPOINT}/owner/restaurants/${restaurantId}/menus/items` as const,
      SUB_CATEGORY: (restaurantId: string) =>
        `${API_BASE_ENDPOINT}/owner/restaurants/${restaurantId}/menus/sub-categories` as const,
      CATEGORY: {
        BASE: (restaurantId: string) =>
          `${API_BASE_ENDPOINT}/owner/restaurants/${restaurantId}/menus/categories` as const,
        DEMO: (restaurantId: string) =>
          `${API_BASE_ENDPOINT}/owner/restaurants/${restaurantId}/menus/demo/categories` as const,
      },
    } as const,
    TABLE: {
      ORDER: {
        REQUEST: (
          restaurantTableId: string,
          orderId: string,
          requestId: string
        ) =>
          `${API_BASE_ENDPOINT}/owner/restaurants/tables/${restaurantTableId}/orders/${orderId}/requests/${requestId}` as const,
        PAYMENT: (restaurantTableId: string, orderId: string) =>
          `${API_BASE_ENDPOINT}/owner/restaurants/tables/${restaurantTableId}/orders/${orderId}/payments` as const,
      },
    },
  } as const,
} as const;

export const ME_ENDPOINT = {
  USER: `${API_BASE_ENDPOINT}/me/users`,
  RESTAURANT: `${API_BASE_ENDPOINT}/me/restaurants`,
  TABLE: `${API_BASE_ENDPOINT}/me/restaurants/tables`,
  ORDER: `${API_BASE_ENDPOINT}/me/restaurants/tables/orders`,
  ORDER_REQUEST: `${API_BASE_ENDPOINT}/me/restaurants/tables/orders/requests`,
} as const;

export const ORDER_ENDPOINT = {
  BASE: (orderId: string) => `${API_BASE_ENDPOINT}/orders/${orderId}` as const,
} as const;

export const ORDER_REQUEST_ENDPOINT = {
  BASE: (orderId: string) =>
    `${API_BASE_ENDPOINT}/orders/${orderId}/requests` as const,
} as const;

export const RESTAURANT_ENDPOINT = {
  BASE: (restaurantId: string) =>
    `${API_BASE_ENDPOINT}/restaurants/${restaurantId}` as const,
} as const;

export const RESTAURANT_ORDER_ENDPOINT = {
  ORDER_REQUEST: (restaurantTableId: string, orderId: string) =>
    `${API_BASE_ENDPOINT}/restaurants/tables/${restaurantTableId}/orders/${orderId}/requests` as const,
  ORDER_ITEM: (restaurantTableId: string, orderId: string) =>
    `${API_BASE_ENDPOINT}/restaurants/tables/${restaurantTableId}/orders/${orderId}/items` as const,
} as const;

export const RESTAURANT_MENU_ENDPOINT = {
  CATEGORY: (restaurantId: string) =>
    `${API_BASE_ENDPOINT}/restaurants/${restaurantId}/menus/categories` as const,
} as const;

export const CART_ENDPOINT = {
  MENU_ITEM: `${API_BASE_ENDPOINT}/cart/menu-items`,
} as const;
