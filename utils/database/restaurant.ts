import { Restaurant } from "@prisma/client";

export async function getRestaurant(
  userId: string
): Promise<Restaurant | null | undefined> {
  if (!userId) {
    return null;
  }

  try {
    const restaurantResult = await prisma?.restaurant.findUnique({
      where: {
        userId,
      },
    });

    return restaurantResult;
  } catch (e) {
    console.error("Error fetching restaurant by ID: ", e);
    throw e;
  }
}

export async function getAllRestaurants(): Promise<Restaurant[] | null> {
  return null;
}

export async function createRestaurant(
  userId: string
): Promise<Restaurant | null | undefined> {
  if (!userId) {
    return null;
  }

  try {
    const newRestaurant = await prisma?.restaurant.create({
      data: {
        userId,
      },
    });

    if (!newRestaurant) {
      throw new Error("failed to create restaurant");
    }

    return newRestaurant;
  } catch (e) {
    console.error("Error creating restaurant: ", e);
    throw e;
  }
}
