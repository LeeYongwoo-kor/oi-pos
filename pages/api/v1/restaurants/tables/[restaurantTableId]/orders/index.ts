import { Method } from "@/constants/fetch";
import { getOrderTableIdAndConditions } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { ValidationError } from "@/lib/shared/error/ApiError";
import validateAndConvertQuery from "@/utils/validation/validateAndConvertQuery";
import { OrderStatus } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

export type IGetOrderRawQuery = ToRawQuery<IGetOrderQuery>;

export interface IGetOrderQuery {
  orderStatus?: OrderStatus | OrderStatus[];
  startDate?: Date;
  endDate?: Date;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === Method.GET) {
    const { restaurantTableId, ...params } = req.query;
    if (typeof restaurantTableId !== "string") {
      throw new ValidationError("Failed to get orders info. Please try again");
    }

    const validatedQuery = validateAndConvertQuery<IGetOrderQuery>(params, {
      orderStatus: { type: { enum: OrderStatus } },
      startDate: { type: "date" },
      endDate: { type: "date" },
    });

    const orders = await getOrderTableIdAndConditions(
      restaurantTableId,
      validatedQuery
    );

    // If order is cancelled or completed, move it to the bottom of the list
    if (orders) {
      orders.sort((a, b) => {
        if (
          a.status === OrderStatus.CANCELLED ||
          a.status === OrderStatus.COMPLETED
        )
          return 1;
        if (
          b.status === OrderStatus.CANCELLED ||
          b.status === OrderStatus.COMPLETED
        )
          return -1;

        return 0;
      });
    }

    return res.status(200).json(orders);
  }
}

export default withApiHandler({
  methods: ["GET"],
  handler,
  isLoginRequired: false,
});
