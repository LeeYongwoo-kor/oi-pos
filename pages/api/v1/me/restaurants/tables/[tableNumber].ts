import { ME_ENDPOINT } from "@/constants/endpoint";
import { getRestuarnatTableForTableHistory } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { NotFoundError, ValidationError } from "@/lib/shared/error/ApiError";
import validateAndConvertQuery from "@/utils/validation/validateAndConvertQuery";
import { TableType } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";

export interface IGetMyTableQuery {
  tableType?: TableType;
  tableNumber?: number;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session?: Session | null
) {
  if (!session?.restaurantId) {
    throw ValidationError.builder()
      .setMessage("Failed to get restaurant table info")
      .setEndpoint(ME_ENDPOINT.ORDER)
      .build();
  }

  const { tableType, tableNumber } = req.query;
  const { tableType: validTableType, tableNumber: validNumber } =
    validateAndConvertQuery<IGetMyTableQuery>(
      { tableType, tableNumber },
      {
        tableType: { type: { enum: TableType }, required: true },
        tableNumber: { type: "number", required: true },
      }
    );

  const tableInfo = await getRestuarnatTableForTableHistory(
    session.restaurantId,
    {
      tableType: validTableType,
      tableNumber: validNumber,
    }
  );

  if (!tableInfo) {
    throw NotFoundError.builder()
      .setMessage(
        "Restaurant Table info not found. Please check parameter and try again"
      )
      .setEndpoint(ME_ENDPOINT.TABLE_NUMBER(tableNumber as string))
      .build();
  }

  return res.status(200).json(tableInfo);
}

export default withApiHandler({
  methods: ["GET"],
  handler,
});
