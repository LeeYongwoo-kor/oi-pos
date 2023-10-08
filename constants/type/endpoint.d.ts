declare interface RestaurantDynamicUrl {
  restaurantId: string;
}

declare interface RestaurantTableDynamicUrl {
  restaurantTableId: string;
}

declare interface OrderDynamicUrl {
  restaurantTableId: string;
  orderId: string;
}

declare interface OrderDetailDynamicUrl {
  orderId: string;
}

declare interface CheckoutDynamicUrl {
  orderId: string;
}

declare interface OrderRequestDynamicUrl {
  restaurantTableId: string;
  orderId: string;
  requestId: string;
}
