import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/ApiError";
import checkNullUndefined from "@/utils/checkNullUndefined";
import convertDatesToISOString from "@/utils/convertDatesToISOString";
import { TableTypeAssignment } from "@prisma/client";

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
