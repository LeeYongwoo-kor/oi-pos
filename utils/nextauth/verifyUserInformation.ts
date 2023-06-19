import {
  getMenuItem,
  getRestaurant,
  getRestaurantTable,
  getSubscription,
  getUserById,
  updateSubscriptionStatus,
} from "@/database";
import { withErrorRetry } from "@/lib/server/withErrorRetry";
import {
  ApiError,
  ForbiddenError,
  GoneError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/shared/ApiError";
import {
  MenuItem,
  Restaurant,
  RestaurantTable,
  Subscription,
  SubscriptionStatus,
  User,
  UserStatus,
} from "@prisma/client";
import { JWT } from "next-auth/jwt";

export async function verifyUserInformation(token: JWT): Promise<JWT> {
  try {
    // 1. check user status
    const userInfo = await withErrorRetry<User | null>(() =>
      getUserById(token.sub)
    )();
    if (!userInfo || userInfo.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError(
        "You are not active user. Please contact support team."
      );
    }

    // 2. check subscription status and check subscription info -> redirect plan register page
    const subscriptionInfo = await withErrorRetry<Subscription | null>(() =>
      getSubscription(token.sub)
    )();
    if (!subscriptionInfo) {
      throw new NotFoundError(
        "You don't have subscription. Please register your subscription first.",
        undefined,
        "/plans/register"
      );
    }

    if (
      subscriptionInfo.status === SubscriptionStatus.CANCELLED ||
      subscriptionInfo.status === SubscriptionStatus.PENDING
    ) {
      throw new ForbiddenError(
        "Your subscription is cancelled or pending. Please contact support team.",
        undefined,
        "/plans/register"
      );
    }

    if (subscriptionInfo.status === SubscriptionStatus.EXPIRED) {
      throw new GoneError(
        "Your subscription has expired. Please renew your subscription.",
        undefined,
        "/plans/register"
      );
    }

    // 3. check subscription expiration date -> redirect plan register page
    const currentDate = new Date();
    const subscriptionEndDate = new Date(subscriptionInfo.currentPeriodEnd);
    if (subscriptionEndDate < currentDate) {
      await withErrorRetry<Subscription | null>(() =>
        updateSubscriptionStatus(token.sub, SubscriptionStatus.EXPIRED)
      )();
      throw new GoneError(
        "Your subscription has expired. Please renew your subscription.",
        undefined,
        "/plans/register"
      );
    }

    // 4. check restraurant info -> redirect restaurant register page(step 1)
    const restaurantInfo = await withErrorRetry<Restaurant | null>(() =>
      getRestaurant(token.sub)
    )();
    if (!restaurantInfo) {
      throw new NotFoundError(
        "You don't register restaurant information yet. Please register restaurant information.",
        undefined,
        "/restaurants/info"
      );
    }

    // 5. check restraurant info of startTime, endTime -> redirect hours register page(step 2)
    if (!restaurantInfo.startTime || !restaurantInfo.endTime) {
      throw new NotFoundError(
        "You don't register restaurant hours. Please register restaurant hours.",
        undefined,
        "/restaurants/hours"
      );
    }

    // 6. check restraurantTable info -> redirect table register page(step 3)
    const restaurantTableInfo = await withErrorRetry<RestaurantTable | null>(
      () => getRestaurantTable(restaurantInfo.id)
    )();
    if (!restaurantTableInfo) {
      throw new NotFoundError(
        "You don't register restaurant table. Please register restaurant table.",
        undefined,
        "/restaurants/table"
      );
    }

    // 7. check menu info -> redirect menu register page(step 4)
    const menuInfo = await withErrorRetry<MenuItem | null>(() =>
      getMenuItem(restaurantInfo.id)
    )();
    if (!menuInfo) {
      throw new NotFoundError(
        "You don't register menu. Please register menu.",
        undefined,
        "/menus"
      );
    }

    // registered all information
    return { ...token, isAllInfoRegistered: true };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err instanceof UnauthorizedError) {
        // Go to login page
        return {
          ...token,
          errorName: err.name,
          message: err.message,
        };
      }

      // Go to redirectUrl
      return { ...token, message: err.message, redirectUrl: err.redirectUrl };
    }

    //TODO: send error to sentry
    console.error(
      "Unknown error occurred in validating user information: ",
      err
    );

    return {
      ...token,
      errorName: "UnknownError",
      message: "Unknown error verifying user information",
    };
  }
}
