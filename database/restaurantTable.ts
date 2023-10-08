import { COUNTER_NUMBER_MAX, TABLE_NUMBER_MAX } from "@/constants/plan";
import prismaRequestHandler from "@/lib/server/prisma/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/error/ApiError";
import checkNullUndefined, {
  hasNullUndefined,
} from "@/utils/validation/checkNullUndefined";
import isEmpty from "@/utils/validation/isEmpty";
import isPositiveInteger from "@/utils/validation/isPositiveInteger";
import {
  OrderStatus,
  Prisma,
  Restaurant,
  RestaurantTable,
  TableType,
} from "@prisma/client";
import { nanoid } from "nanoid";
import { IOrderForDashboard } from "./order";
import { IRestaurant } from "./restaurant";
import { IGetMyOrderQuery } from "@/pages/api/v1/me/restaurants/tables/orders";

export interface IRestaurantTable extends RestaurantTable {
  restaurant: IRestaurant;
}

export interface IRestaurantTableForDashboard extends RestaurantTable {
  orders: IOrderForDashboard[];
}

export interface IRestaurantTableForAccess extends RestaurantTable {
  restaurant: Pick<
    Restaurant,
    "startTime" | "endTime" | "lastOrder" | "holidays"
  >;
}

export interface CreateAndDeleteRestaurantTablesResult {
  result: "CREATED" | "DELETED" | "NO_CHANGE";
  count: number;
}
export interface CreateRestaurantTablesInput {
  restaurantId: string;
  qrCodeId: string;
  tableType: TableType;
  number: number;
}

export async function getRestaurantTablesByRestaurantId(
  restaurantId: string | undefined | null,
  limit?: number | undefined
): Promise<IRestaurantTableForDashboard[] | null> {
  if (!restaurantId) {
    return null;
  }

  return prismaRequestHandler(
    prisma.restaurantTable.findMany({
      where: {
        restaurantId,
      },
      take: limit || TABLE_NUMBER_MAX + COUNTER_NUMBER_MAX,
      orderBy: {
        number: "asc",
      },
      include: {
        orders: {
          orderBy: {
            createdAt: "desc",
          },
          where: {
            status: {
              notIn: [OrderStatus.CANCELLED, OrderStatus.COMPLETED],
            },
          },
          include: {
            orderRequests: {
              orderBy: {
                createdAt: "desc",
              },
              include: {
                orderItems: true,
              },
            },
          },
        },
      },
    }),
    "getRestaurantTablesByRestaurantId"
  );
}

export async function getRestaurantTablesByRestaurantIdAndType(
  restaurantId: string,
  tableType: TableType
): Promise<RestaurantTable[] | null> {
  if (hasNullUndefined({ restaurantId, tableType })) {
    return null;
  }

  return prismaRequestHandler(
    prisma.restaurantTable.findMany({
      where: {
        restaurantId,
        tableType,
      },
      orderBy: {
        number: "asc",
      },
    }),
    "getRestaurantTablesByRestaurantIdAndType"
  );
}

export async function getRestaurantTableByQrCodeId(
  qrCodeId: string | undefined | null
): Promise<IRestaurantTableForAccess | null> {
  if (!qrCodeId) {
    return null;
  }

  return prismaRequestHandler(
    prisma.restaurantTable.findUnique({
      where: {
        qrCodeId,
      },
      include: {
        restaurant: {
          select: {
            startTime: true,
            endTime: true,
            holidays: true,
            lastOrder: true,
          },
        },
      },
    }),
    "getRestaurantTableByQrCodeId"
  );
}

export async function getMaxNumberOfRestaurantTable(
  restaurantId: string,
  tableType: TableType
): Promise<number> {
  if (hasNullUndefined({ restaurantId, tableType })) {
    throw new ValidationError("Failed to get max number of restaurant table");
  }

  const maxNumberTable = await prismaRequestHandler(
    prisma.restaurantTable.findFirst({
      where: {
        restaurantId,
        tableType,
      },
      orderBy: { number: "desc" },
    }),
    "getMaxNumberOfRestaurantTable"
  );

  return maxNumberTable ? maxNumberTable.number : 0;
}

export async function getRestuarnatTableForTableHistory(
  restaurantId: string | undefined | null,
  { tableType, tableNumber }: IGetMyOrderQuery
): Promise<RestaurantTable | null> {
  if (!restaurantId || !tableNumber || !tableType) {
    return null;
  }

  return prismaRequestHandler(
    prisma.restaurantTable.findUnique({
      where: {
        restaurantId_tableType_number: {
          number: tableNumber,
          tableType,
          restaurantId,
        },
      },
    }),
    "getRestuarnatTableForTableHistory"
  );
}

export async function createRestaurantTable(
  restaurantId: string,
  qrCodeId: string,
  tableType: TableType,
  number: number
): Promise<RestaurantTable> {
  if (hasNullUndefined({ restaurantId, qrCodeId, tableType, number })) {
    throw new ValidationError("Failed to create restaurant table");
  }

  return prismaRequestHandler(
    prisma.restaurantTable.create({
      data: {
        restaurantId,
        qrCodeId,
        tableType,
        number,
      },
    }),
    "createRestaurantTable"
  );
}

export async function createRestaurantTables(
  restaurantTables: CreateRestaurantTablesInput[]
): Promise<Prisma.BatchPayload> {
  if (isEmpty(restaurantTables)) {
    throw new ValidationError("Failed to create restaurant tables");
  }

  const createdRestaurantTables = prismaRequestHandler(
    prisma.restaurantTable.createMany({
      data: restaurantTables,
      skipDuplicates: true,
    }),
    "createRestaurantTables"
  );

  return createdRestaurantTables;
}

export async function updateRestaurantTable(
  tableId: string | undefined | null,
  updateInfo: Prisma.RestaurantTableUpdateInput
): Promise<RestaurantTable> {
  const { hasNullUndefined } = checkNullUndefined(updateInfo);

  if (!tableId || hasNullUndefined) {
    throw new ValidationError(
      "Failed to update restaurant table. Please try again later"
    );
  }

  return prismaRequestHandler(
    prisma.restaurantTable.update({
      where: {
        id: tableId,
      },
      data: updateInfo as Prisma.RestaurantTableUpdateInput,
    }),
    "updateRestaurantTable"
  );
}

export async function deleteRestaurantTables(
  restaurantId: string,
  tableType: TableType,
  inputNumber: number
): Promise<Prisma.BatchPayload> {
  if (hasNullUndefined({ restaurantId, tableType, inputNumber })) {
    throw new ValidationError("Failed to delete restaurant tables");
  }

  const deletedRestaurantTables = await prismaRequestHandler(
    prisma.restaurantTable.deleteMany({
      where: {
        restaurantId,
        tableType,
        number: {
          gt: inputNumber,
        },
      },
    }),
    "deleteRestaurantTables"
  );

  return deletedRestaurantTables;
}

export async function createOrDeleteRestaurantTables(
  restaurantId: string,
  tableType: TableType,
  inputNumber: number
): Promise<CreateAndDeleteRestaurantTablesResult> {
  if (!restaurantId) {
    throw new ValidationError("Failed to create or delete restaurant tables");
  }

  if (inputNumber !== 0 && !isPositiveInteger(inputNumber)) {
    throw new ValidationError(`${tableType} number is not a positive number`);
  }

  let response: CreateAndDeleteRestaurantTablesResult = {
    result: "NO_CHANGE",
    count: 0,
  };

  const maxNumberFromDB = await getMaxNumberOfRestaurantTable(
    restaurantId,
    tableType
  );

  if (maxNumberFromDB < inputNumber) {
    const newTablesInput: CreateRestaurantTablesInput[] = Array.from(
      { length: inputNumber - maxNumberFromDB },
      (_, i) => ({
        restaurantId,
        qrCodeId: nanoid(),
        tableType,
        number: i + maxNumberFromDB + 1,
      })
    );
    const createdTables = await createRestaurantTables(newTablesInput);
    response = { result: "CREATED", count: createdTables.count };
  } else {
    if (maxNumberFromDB === inputNumber) {
      return response;
    }
    const deletedTables = await deleteRestaurantTables(
      restaurantId,
      tableType,
      inputNumber
    );
    response = { result: "DELETED", count: deletedTables.count };
  }

  return response;
}
