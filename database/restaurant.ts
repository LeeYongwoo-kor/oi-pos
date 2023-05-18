import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/CustomError";
import { Restaurant } from "@prisma/client";

export async function getRestaurant(
  userId: string
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

  return restaurant;
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

  return newRestaurant;
}
