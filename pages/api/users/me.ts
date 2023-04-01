import withHandler from "@/lib/withHandler";
import prisma from "@/lib/prismadb";
import { NextApiRequest, NextApiResponse } from "next";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // const session: any = await getSession({ req });

  // if (!session) {
  //   return res.status(401).send("Unauthorized");
  // }

  // const { user } = session;

  // res.status(200).json(user);
  if (req.method === "POST") {
    const { email } = req.body;
    console.log(email);

    try {
      const existingUser = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (existingUser) {
        res.status(200).json({ exists: true });
      } else {
        res.status(200).json({ exists: false });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "An error occurred while checking the account." });
    }
  } else {
    res.status(405).json({ error: "Method not allowed." });
  }
}

export default withHandler({
  methods: ["POST"],
  handler,
});
