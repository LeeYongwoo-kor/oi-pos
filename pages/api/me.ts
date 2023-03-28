import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session: any = await getSession({ req });

  if (!session) {
    return res.status(401).send("Unauthorized");
  }

  const { user } = session;

  res.status(200).json(user);
}
