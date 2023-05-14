import { Session } from "@/types/next-auth.types";
import CustomError from "@/lib/shared/CustomError";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";

export interface ResponseType {
  ok: boolean;
  [key: string]: any;
}

interface ConfigType {
  methods: Method[];
  handler: (
    req: NextApiRequest,
    res: NextApiResponse,
    session?: Session | null
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
    const session = await getSession({ req });
    console.log("this is withHandler");

    if (isLoginRequired && !session) {
      return res.status(401).json({ message: "You must be logged in" });
    }

    if (req.method && !methods.includes(req.method as any)) {
      return res.status(405).json({ message: "Method not allowed" });
    }

    try {
      await handler(req, res, session);
    } catch (error) {
      //TODO: send error to sentry
      console.error(error);
      if (error instanceof CustomError) {
        return res
          .status(500)
          .json({ message: error.message, originalError: error.originalError });
      }

      return res.status(500).json({ error });
    }
  };
}
