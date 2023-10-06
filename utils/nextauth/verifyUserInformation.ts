import { PLAN_URL, RESTAURANT_URL } from "@/constants/url";
import {
  IUserForVerify,
  getUserInfoForVerify,
  updateSubscriptionStatus,
} from "@/database";
import {
  ApiError,
  ForbiddenError,
  GoneError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/shared/error/ApiError";
import { withErrorRetry } from "@/lib/shared/withErrorRetry";
import { Subscription, SubscriptionStatus, UserStatus } from "@prisma/client";
import { JWT } from "next-auth/jwt";

export async function verifyUserInformation(token: JWT): Promise<JWT> {
  try {
    // 1. check user status
    const user = await withErrorRetry<IUserForVerify | null>(() =>
      getUserInfoForVerify(token.sub)
    )();

    if (
      !user ||
      (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.INACTIVE)
    ) {
      throw new UnauthorizedError(
        "You are not active user. Please contact support team."
      );
    }

    // 2. check subscription status and check subscription info -> redirect plan register page
    if (!user.subscription) {
      throw NotFoundError.builder()
        .setMessage(
          "You don't have subscription. Please register your subscription first"
        )
        .setRedirectUrl(PLAN_URL.REGISTER)
        .build();
    }

    if (
      user.subscription.status === SubscriptionStatus.CANCELLED ||
      user.subscription.status === SubscriptionStatus.PENDING
    ) {
      throw ForbiddenError.builder()
        .setMessage(
          "Your subscription is cancelled or pending. Please contact support team"
        )
        .setRedirectUrl(PLAN_URL.REGISTER)
        .build();
    }

    if (user.subscription.status === SubscriptionStatus.EXPIRED) {
      throw GoneError.builder()
        .setMessage(
          "Your subscription has expired. Please renew your subscription"
        )
        .setRedirectUrl(PLAN_URL.REGISTER)
        .build();
    }

    // 3. check subscription expiration date -> redirect plan register page
    const currentDate = new Date();
    const subscriptionEndDate = new Date(user.subscription.currentPeriodEnd);

    if (subscriptionEndDate < currentDate) {
      await withErrorRetry<Subscription | null>(() =>
        updateSubscriptionStatus(token.sub, SubscriptionStatus.EXPIRED)
      )();

      throw GoneError.builder()
        .setMessage(
          "Your subscription has expired. Please renew your subscription"
        )
        .setRedirectUrl(PLAN_URL.REGISTER)
        .build();
    }

    // If user status is active, not need to check other information
    if (user.status === UserStatus.INACTIVE) {
      // 4. check restraurant info -> redirect restaurant register page(step 1)
      if (!user.restaurant) {
        throw NotFoundError.builder()
          .setMessage(
            "You don't register restaurant information yet. Please register restaurant information"
          )
          .setRedirectUrl(RESTAURANT_URL.SETUP.INFO)
          .build();
      }

      // 5. check restraurant info of startTime, endTime -> redirect hours register page(step 2)
      if (!user.restaurant.startTime || !user.restaurant.endTime) {
        throw NotFoundError.builder()
          .setMessage(
            "You don't register restaurant hours. Please register restaurant hours"
          )
          .setRedirectUrl(RESTAURANT_URL.SETUP.HOURS)
          .build();
      }

      // 6. check restraurantTable info -> redirect table register page(step 3)
      if (!user.restaurant.restaurantTables?.length) {
        throw NotFoundError.builder()
          .setMessage(
            "You don't register restaurant table. Please register restaurant table"
          )
          .setRedirectUrl(RESTAURANT_URL.SETUP.TABLES)
          .build();
      }

      // 7. check menu info -> redirect menu register page(step 4)
      if (!user.restaurant.menuCategories?.length) {
        throw NotFoundError.builder()
          .setMessage("You don't register menu. Please register menu")
          .setRedirectUrl(RESTAURANT_URL.SETUP.MENUS)
          .build();
      }

      // 8. check user status -> redirect complete page(step 5)
      return { ...token, redirectUrl: RESTAURANT_URL.SETUP.COMPLETE };
    }

    // registered all information
    return {
      ...token,
      restaurantId: user.restaurant?.id,
      isAllInfoRegistered: true,
    };
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
