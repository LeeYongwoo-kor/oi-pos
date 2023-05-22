import { getUserByEmail } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { NotFoundError } from "@/lib/shared/CustomError";
import { NextApiRequest, NextApiResponse } from "next";

interface IGetUserQuery {
  email: string;
  [key: string]: string | string[] | undefined;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email } = req.query as IGetUserQuery;
  const existingUser = await getUserByEmail(email);
  if (!existingUser) {
    throw new NotFoundError("User not found with the given email");
  }

  return res.status(200).json(existingUser);
}

export default withApiHandler({
  methods: ["GET"],
  handler,
  isLoginRequired: false,
});
