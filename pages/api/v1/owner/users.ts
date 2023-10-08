import { updateUserStatus } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { UserStatus } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";

export interface IPatchUserBody {
  status: UserStatus;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session?: Session | null
) {
  const { status }: IPatchUserBody = req.body;

  const result = await updateUserStatus(session?.id, status);
  return res.status(200).json(result);
}

export default withApiHandler({
  methods: ["PATCH"],
  handler,
});
