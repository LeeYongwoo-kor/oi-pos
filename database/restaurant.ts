import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/ApiError";
import checkNullUndefined from "@/utils/checkNullUndefined";
import convertDatesToISOString from "@/utils/convertDatesToISOString";
import { Restaurant } from "@prisma/client";

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

  const restaurant = await prismaRequestHandler(
    prisma.restaurant.findUnique({
      where: {
        userId,
      },
    }),
    "getRestaurant"
  );

  return restaurant ? convertDatesToISOString(restaurant) : null;
}

export async function getRestaurantAllInfo(
  userId: string | undefined | null
): Promise<Restaurant | null> {
  if (!userId) {
    return null;
  }

  const restaurant = await prismaRequestHandler(
    prisma.restaurant.findUnique({
      where: {
        userId,
      },
      include: {
        restaurantTables: {
          include: {
            tableTypeAssignments: true,
          },
        },
      },
    }),
    "getRestaurantAllInfo"
  );

  return restaurant ? convertDatesToISOString(restaurant) : null;
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

  const newRestaurant = await prismaRequestHandler(
    prisma.restaurant.create({
      data: {
        userId,
      },
    }),
    "createRestaurant"
  );

  return convertDatesToISOString(newRestaurant);
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

  const newRestaurantInfo = await prismaRequestHandler(
    prisma.restaurant.upsert({
      where: {
        userId: upsertRestaurantInfoData.userId,
      },
      create: upsertRestaurantInfoData,
      update: upsertRestaurantInfoData,
    }),
    "upsertRestaurantInfo"
  );

  return convertDatesToISOString(newRestaurantInfo);
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

  const updateInfo = {
    ...restaurantInfo,
    holidays: JSON.stringify(restaurantInfo.holidays),
  };

  const newRestaurantInfo = await prismaRequestHandler(
    prisma.restaurant.update({
      where: {
        userId,
      },
      data: updateInfo,
    }),
    "updateRestaurantInfo"
  );

  return convertDatesToISOString(newRestaurantInfo);
}
