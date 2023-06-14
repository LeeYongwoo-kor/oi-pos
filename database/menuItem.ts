import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { MenuItem } from "@prisma/client";

export async function getMenuItem(
  restaurantId: string | null | undefined
): Promise<MenuItem | null> {
  if (!restaurantId) {
    return null;
  }

  const menuItem = await prismaRequestHandler(
    prisma.menuItem.findUnique({
      where: {
        id: restaurantId,
      },
    }),
    "getMenuItem"
  );

  return menuItem;
}

export async function getAllMenuItems(): Promise<MenuItem[] | null> {
  return null;
}
