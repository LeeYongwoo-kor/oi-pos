import {
  CustomError,
  MethodNotAllowedError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/shared/CustomError";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";
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
    } catch (err) {
      // Not found error is not sent to sentry
      if (!(err instanceof NotFoundError)) {
        //TODO: send error to sentry
        console.error(err);
      }

      if (err instanceof CustomError) {
        if (err.redirectURL) {
          res.redirect(err.redirectURL);
        }

        return res.status(err.statusCode || 500).json({ message: err.message });
      }

      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
}
