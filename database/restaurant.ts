import prismaRequestHandler from "@/lib/server/prisma/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/error/ApiError";
import checkNullUndefined from "@/utils/validation/checkNullUndefined";
import { Prisma, Restaurant, RestaurantTable } from "@prisma/client";

export interface IRestaurant extends Restaurant {
  restaurantTables: RestaurantTable[];
}
export interface UpsertRestaurantInfoParams {
  userId: string | undefined | null;
  name: string;
  branch: string;
  phoneNumber: string;
  postCode: string;
  address: string;
  restAddress: string;
}

export async function getRestaurant(
  userId: string | undefined | null
): Promise<Restaurant | null> {
  if (!userId) {
    return null;
  }

  return prismaRequestHandler(
    prisma.restaurant.findUnique({
      where: {
        userId,
      },
    }),
    "getRestaurant"
  );
}

export async function getRestaurantByUserId(
  userId: string | undefined | null
): Promise<IRestaurant | null> {
  if (!userId) {
    return null;
  }

  return prismaRequestHandler(
    prisma.restaurant.findUnique({
      where: {
        userId,
      },
      include: {
        restaurantTables: true,
      },
    }),
    "getRestaurantByUserId"
  );
}

export async function getRestaurantAllInfoById(
  restaurantId: string | undefined | null
): Promise<IRestaurant | null> {
  if (!restaurantId) {
    return null;
  }

  return prismaRequestHandler(
    prisma.restaurant.findUnique({
      where: {
        id: restaurantId,
      },
      include: {
        restaurantTables: true,
      },
    }),
    "getRestaurantAllInfoById"
  );
}

export async function getAllRestaurantPhoneNumbers(): Promise<
  { phoneNumber: string | null }[]
> {
  const phoneNumbers = await prismaRequestHandler(
    prisma.restaurant.findMany({
      select: {
        phoneNumber: true,
      },
    }),
    "getAllRestaurantPhoneNumbers"
  );

  return phoneNumbers;
}

export async function getAllRestaurants(): Promise<Restaurant[] | null> {
  return null;
}

export async function createRestaurant(userId: string): Promise<Restaurant> {
  if (!userId) {
    throw new ValidationError("failed to create restaurant");
  }

  return prismaRequestHandler(
    prisma.restaurant.create({
      data: {
        userId,
      },
    }),
    "createRestaurant"
  );
}

export async function upsertRestaurantInfo(
  restaurantInfo: UpsertRestaurantInfoParams
): Promise<Restaurant> {
  const { hasNullUndefined } = checkNullUndefined(restaurantInfo);

  if (!restaurantInfo.userId || hasNullUndefined) {
    throw new ValidationError(
      "Failed to update restaurant info. Please try again later."
    );
  }

  const upsertRestaurantInfoData = {
    userId: restaurantInfo.userId,
    name: restaurantInfo.name,
    branch: restaurantInfo.branch,
    phoneNumber: restaurantInfo.phoneNumber,
    postCode: restaurantInfo.postCode,
    address: restaurantInfo.address,
    restAddress: restaurantInfo.restAddress,
  };

  return prismaRequestHandler(
    prisma.restaurant.upsert({
      where: {
        userId: upsertRestaurantInfoData.userId,
      },
      create: upsertRestaurantInfoData,
      update: upsertRestaurantInfoData,
    }),
    "upsertRestaurantInfo"
  );
}

export async function updateRestaurantInfo<
  T extends Partial<Omit<Restaurant, "id">>
>(userId: string | null | undefined, restaurantInfo: T): Promise<Restaurant> {
  const { hasNullUndefined } = checkNullUndefined(restaurantInfo);

  if (!userId || hasNullUndefined) {
    throw new ValidationError(
      "Failed to update restaurant info. Please try again later."
    );
  }

  return prismaRequestHandler(
    prisma.restaurant.update({
      where: {
        userId,
      },
      data: restaurantInfo as Prisma.RestaurantUpdateInput,
    }),
    "updateRestaurantInfo"
  );
}
