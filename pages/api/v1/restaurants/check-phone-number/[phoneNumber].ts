import {
  UpsertRestaurantInfoParams,
  getAllRestaurantPhoneNumbers,
} from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { ValidationError } from "@/lib/shared/ApiError";
import { NextApiRequest, NextApiResponse } from "next";

export interface IGetPhoneNumberQuery {
  phoneNumber: string | undefined;
  [key: string]: string | string[] | undefined;
}

export type IPutSubscriptionInfoBody = Omit<
  UpsertRestaurantInfoParams,
  "userId"
>;

async function handler(req: NextApiRequest, res: NextApiResponse) {
  let isDuplicate = false;
  const { phoneNumber } = req.query as IGetPhoneNumberQuery;

  if (!phoneNumber) {
    throw new ValidationError("phoneNumber is required");
  }

  const phoneNumbers = await getAllRestaurantPhoneNumbers();
  if (phoneNumbers) {
    isDuplicate = phoneNumbers.some((item) => item.phoneNumber === phoneNumber);
  }

  return res.status(200).json({ isDuplicate });
}

export default withApiHandler({
  methods: ["GET"],
  handler,
});
