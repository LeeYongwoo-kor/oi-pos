import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { Restaurant } from "@prisma/client";

export async function getRestaurant(
  userId: string
): Promise<Restaurant | null> {
  if (!userId) {
    return null;
  }

  const [restaurant, error] = await prismaRequestHandler(
    prisma.restaurant.findUnique({
      where: {
        userId,
      },
    }),
    "getRestaurant"
  );

  if (error) {
    throw new Error(error.message);
  }

  return restaurant;
}

export async function getAllRestaurants(): Promise<Restaurant[] | null> {
  return null;
}

export async function createRestaurant(userId: string): Promise<Restaurant> {
  if (!userId) {
    throw new Error("failed to create restaurant");
  }

  const [newRestaurant, error] = await prismaRequestHandler(
    prisma.restaurant.create({
      data: {
        userId,
      },
    }),
    "createRestaurant"
  );

  if (error) {
    throw new Error(error.message);
  }

  return newRestaurant;
}
