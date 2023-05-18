import {
  CustomError,
  MethodNotAllowedError,
  UnauthorizedError,
} from "@/lib/shared/CustomError";
import { Session } from "@/types/next-auth.types";
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

    if (isLoginRequired && !session) {
      throw new UnauthorizedError("Unauthorized. You must be signed in");
    }

    if (req.method && !methods.includes(req.method as Method)) {
      throw new MethodNotAllowedError(
        "Method Not Allowed. Please try request with correct method"
      );
    }

    try {
      await handler(req, res, session);
    } catch (error) {
      //TODO: send error to sentry
      console.error(error);

      if (error instanceof CustomError) {
        if (error.redirectURL) {
          res.redirect(error.redirectURL);
        }

        return res
          .status(error.statusCode || 500)
          .json({ message: error.message });
      }

      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
}
