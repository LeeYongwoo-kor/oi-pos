import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/error/ApiError";
import checkNullUndefined from "@/utils/validation/checkNullUndefined";
import convertDatesToISOString from "@/utils/convertDatesToISOString";
import { TableTypeAssignment } from "@prisma/client";
import isPositiveInteger from "@/utils/validation/isPositiveInteger";

/**
 * @deprecated
 * This function is no longer used and will be removed in a future release
 */
export type UpsertTableTypeParams = {
  restaurantTableId: string | null | undefined;
  tableType: TableType;
  number: number;
};

/**
 * @deprecated
 * This function is no longer used and will be removed in a future release
 */
export async function getTableTypeAssignments(
  restaurantTableId: string | undefined | null
): Promise<TableTypeAssignment[] | null> {
  if (!restaurantTableId) {
    return null;
  }

  const tableTypeAssignments = await prismaRequestHandler(
    prisma.tableTypeAssignment.findMany({
      where: {
        restaurantTableId,
      },
    }),
    "getTableTypeAssignments"
  );

  return tableTypeAssignments
    ? tableTypeAssignments.map((table) => convertDatesToISOString(table))
    : null;
}

/**
 * @deprecated
 * This function is no longer used and will be removed in a future release
 */
export async function createTableTypeAssignment(
  restaurantTableId: string,
  tableType: TableType,
  number: number
): Promise<TableTypeAssignment> {
  const { hasNullUndefined } = checkNullUndefined({
    restaurantTableId,
    tableType,
    number,
  });

  if (!restaurantTableId || hasNullUndefined) {
    throw new ValidationError("failed to create table type assignment");
  }

  const newTableTypeAssignment = await prismaRequestHandler(
    prisma.tableTypeAssignment.create({
      data: {
        restaurantTableId,
        tableType,
        number,
      },
    }),
    "createTableTypeAssignment"
  );

  return convertDatesToISOString(newTableTypeAssignment);
}

/**
 * @deprecated
 * This function is no longer used and will be removed in a future release
 */
export async function upsertTableTypeAssignment(
  tableTypeInfo: UpsertTableTypeParams
): Promise<TableTypeAssignment> {
  const { hasNullUndefined } = checkNullUndefined(tableTypeInfo);

  if (hasNullUndefined) {
    throw new ValidationError("Failed to update table type assignment");
  }

  const number = Number(tableTypeInfo.number);
  if (!isPositiveInteger(number)) {
    throw new ValidationError("Number is not a positive number");
  }

  const upsertTableTypeAssignmentData = {
    restaurantTableId: tableTypeInfo.restaurantTableId as string,
    tableType: tableTypeInfo.tableType,
    number,
  };

  const newTableInfo = await prismaRequestHandler(
    prisma.tableTypeAssignment.upsert({
      where: {
        restaurantTableId_tableType: {
          restaurantTableId: tableTypeInfo.restaurantTableId as string,
          tableType: tableTypeInfo.tableType,
        },
      },
      create: upsertTableTypeAssignmentData,
      update: upsertTableTypeAssignmentData,
    }),
    "updateTableTypeAssignment"
  );

  return convertDatesToISOString(newTableInfo);
}
