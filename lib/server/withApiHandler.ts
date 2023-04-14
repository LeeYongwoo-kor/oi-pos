import { NextApiRequest, NextApiResponse } from "next";
import { JWT, getToken } from "next-auth/jwt";

export interface ResponseType {
  ok: boolean;
  [key: string]: any;
}

type method = "GET" | "POST" | "DELETE" | "PATCH" | "PUT";

interface ConfigType {
  methods: method[];
  handler: (
    req: NextApiRequest,
    res: NextApiResponse,
    token: JWT | null
  ) => void;
  isLoginRequired?: boolean;
}

export default function withApiHandler({
  methods,
  handler,
  isLoginRequired = true,
}: ConfigType) {
  return async function (
    req: NextApiRequest,
    res: NextApiResponse
  ): Promise<any> {
    const token = await getToken({ req });
    console.log("this is withHandler");

    if (isLoginRequired && !token) {
      return res.status(401).json({ message: "You must be logged in" });
    }

    if (req.method && !methods.includes(req.method as any)) {
      return res.status(405).json({ message: "Method not allowed" });
    }
    try {
      await handler(req, res, token);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  };
}
