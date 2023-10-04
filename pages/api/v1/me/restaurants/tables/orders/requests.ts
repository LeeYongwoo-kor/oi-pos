import { ME_ENDPOINT } from "@/constants/endpoint";
import { getOrderRequestsForAlarm } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { ValidationError } from "@/lib/shared/error/ApiError";
import validateAndConvertQuery from "@/utils/validation/validateAndConvertQuery";
import { OrderRequestStatus, TableType } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";

export type IGetMyOrderRequestRawQuery = ToRawQuery<IGetMyOrderRequestQuery>;

export interface IGetMyOrderRequestQuery {
  status?: OrderRequestStatus | OrderRequestStatus[];
  tableType?: TableType | TableType[];
  tableNumber?: number;
  limit?: number;
  offset?: number;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session?: Session | null
) {
  const restaurantId = session?.restaurantId;
  if (!restaurantId) {
    throw ValidationError.builder()
      .setMessage("Failed to get active order request info")
      .setEndpoint(ME_ENDPOINT.ORDER_REQUEST)
      .build();
  }

  const validatedQuery = validateAndConvertQuery<IGetMyOrderRequestQuery>(
    req.query,
    {
      status: { type: { enum: OrderRequestStatus } },
      tableType: { type: { enum: TableType } },
      tableNumber: { type: "number" },
      limit: { type: "number" },
      offset: { type: "number" },
    }
  );

  const allOrderRequests = await getOrderRequestsForAlarm(
    restaurantId,
    validatedQuery
  );

  return res.status(200).json(allOrderRequests);
}

export default withApiHandler({
  methods: ["GET"],
  handler,
});
