import withApiHandler from "@/lib/server/withApiHandler";
import { getUserByEmail } from "@/utils/database";
import { NextApiRequest, NextApiResponse } from "next";
import { JWT } from "next-auth/jwt";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  token: JWT | null
) {
  const { email } = req.body;
  // console.log(req);
  console.log(token);

  // test
  if (req.method === "GET") {
    res.status(200).json({ hi: "hello" });
  }

  if (req.method === "POST") {
    try {
      const existingUser = await getUserByEmail(email);

      if (!existingUser) {
        res.status(200).json({ exists: false });
      }

      res.status(200).json(existingUser);
    } catch (error) {
      res
        .status(500)
        .json({ error: "An error occurred while checking the account." });
    }
  }
}

export default withApiHandler({
  methods: ["GET", "POST"],
  handler,
  isLoginRequired: false,
});
