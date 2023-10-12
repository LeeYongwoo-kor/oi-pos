import { ME_ENDPOINT } from "@/constants/endpoint";
import { getActiveOrderForOrderPayment } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { NotFoundError, ValidationError } from "@/lib/shared/error/ApiError";
import convertOrderNumberToNumber from "@/utils/converter/convertOrderNumberToNumber";
import validateAndConvertQuery from "@/utils/validation/validateAndConvertQuery";
import { TableType } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";

export interface IGetMyOrderQuery {
  tableType?: TableType;
  tableNumber?: number;
  orderNumber?: number;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session?: Session | null
) {
  if (!session?.restaurantId) {
    throw ValidationError.builder()
      .setMessage("Failed to get active orders info")
      .setEndpoint(ME_ENDPOINT.ORDER)
      .build();
  }

  const { tableType, tableNumber, orderNumber } = req.query;
  if (typeof orderNumber !== "string") {
    throw new ValidationError(
      "Failed to get order info. Please check parameter and try again"
    );
  }

  const { tableType: validTableType, tableNumber: validNumber } =
    validateAndConvertQuery<IGetMyOrderQuery>(
      { tableType, tableNumber },
      {
        tableType: { type: { enum: TableType }, required: true },
        tableNumber: { type: "number", required: true },
      }
    );

  const formattedOrderNumber = convertOrderNumberToNumber(orderNumber);

  const orderInfo = await getActiveOrderForOrderPayment(session.restaurantId, {
    tableType: validTableType,
    tableNumber: validNumber,
    orderNumber: formattedOrderNumber,
  });

  if (!orderInfo) {
    throw NotFoundError.builder()
      .setMessage("Order info not found. Please check parameter and try again")
      .setEndpoint(ME_ENDPOINT.ORDER)
      .build();
  }

  return res.status(200).json(orderInfo);
}

export default withApiHandler({
  methods: ["GET"],
  handler,
});
