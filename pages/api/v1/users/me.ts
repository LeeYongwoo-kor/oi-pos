import { getUserByEmail } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { NotFoundError } from "@/lib/shared/CustomError";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session?: Session | null
) {
  const existingUser = await getUserByEmail(session?.user.email);
  if (!existingUser) {
    throw new NotFoundError("User not found with the given email");
  }

  return res.status(200).json(existingUser);
}

export default withApiHandler({
  methods: ["GET"],
  handler,
});
