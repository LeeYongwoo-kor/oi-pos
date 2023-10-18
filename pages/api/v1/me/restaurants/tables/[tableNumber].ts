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
      .setEndpoint(ME_ENDPOINT.TABLE_NUMBER(req.query.tableNumber as string))
      .build();
  }

  const { tableType, tableNumber } = validateAndConvertQuery<IGetMyTableQuery>(
    { tableType: req.query.tableType, tableNumber: req.query.tableNumber },
    {
      tableType: { type: { enum: TableType }, required: true },
      tableNumber: { type: "number", required: true },
    }
  );

  const tableInfo = await getRestuarnatTableForTableHistory(
    session.restaurantId,
    {
      tableType,
      tableNumber,
    }
  );

  if (!tableInfo) {
    throw NotFoundError.builder()
      .setMessage(
        "Restaurant Table info not found. Please check parameter and try again"
      )
      .setEndpoint(ME_ENDPOINT.TABLE_NUMBER(String(tableNumber)))
      .build();
  }

  return res.status(200).json(tableInfo);
}

export default withApiHandler({
  methods: ["GET"],
  handler,
});
