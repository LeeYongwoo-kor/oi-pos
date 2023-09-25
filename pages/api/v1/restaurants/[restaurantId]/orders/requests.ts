import { RESTAURANT_ORDER_ENDPOINT } from "@/constants/endpoint";
import { RESTAURANT_URL } from "@/constants/url";
import { getAllOrderRequestsInUseByRestaurantId } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { NotFoundError, ValidationError } from "@/lib/shared/error/ApiError";
import isPositiveInteger from "@/utils/validation/isPositiveInteger";
import { OrderRequestStatus } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session?: Session | null
) {
  const { restaurantId, limit, status, offset } = req.query;
  if (
    typeof restaurantId !== "string" ||
    (limit && typeof limit !== "string") ||
    (status && typeof status !== "string") ||
    (offset && typeof offset !== "string")
  ) {
    throw new ValidationError("Failed to get order requests. Please try again");
  }

  if (limit && !isPositiveInteger(Number(limit))) {
    throw new ValidationError("Invalid limit parameter. Please try again");
  }

  if (isNaN(Number(offset))) {
    throw new ValidationError("Invalid offset parameter. Please try again");
  }

  if (
    status &&
    !Object.values(OrderRequestStatus).includes(
      status.toUpperCase() as OrderRequestStatus
    )
  ) {
    throw new ValidationError(
      "Invalid status parameter. status must be 'placed' or 'confirmed' or 'cancelled'"
    );
  }

  const allOrderRequests = await getAllOrderRequestsInUseByRestaurantId(
    restaurantId,
    Number(limit),
    Number(offset),
    status as OrderRequestStatus
  );
  if (!allOrderRequests) {
    throw NotFoundError.builder()
      .setMessage("Restaurant not found. Please create restaurant first")
      .setRedirectUrl(RESTAURANT_URL.SETUP.INFO)
      .setEndpoint(RESTAURANT_ORDER_ENDPOINT.ORDER_REQUEST(restaurantId))
      .build();
  }

  return res.status(200).json(allOrderRequests);
}

export default withApiHandler({
  methods: ["GET"],
  handler,
});
