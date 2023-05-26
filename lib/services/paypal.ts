import { core, orders } from "@paypal/checkout-server-sdk";

const environment = () => {
  if (process.env.NODE_ENV === "production") {
    return new core.LiveEnvironment(
      process.env.PAYPAL_CLIENT_ID!,
      process.env.PAYPAL_APP_SECRET!
    );
  } else {
    return new core.SandboxEnvironment(
      process.env.PAYPAL_CLIENT_ID!,
      process.env.PAYPAL_APP_SECRET!
    );
  }
};

export const apiClient = {
  client: () => {
    return new core.PayPalHttpClient(environment());
  },
  orders,
};
