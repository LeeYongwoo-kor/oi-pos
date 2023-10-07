import {
  ApiError,
  MethodNotAllowedError,
  UnauthorizedError,
} from "@/lib/shared/error/ApiError";
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
  isLoginRequired?: boolean | Method[];
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
    try {
      const session = await getSession({ req });

      const requireLoginForMethod =
        typeof isLoginRequired === "boolean"
          ? isLoginRequired
          : isLoginRequired.includes(req.method as Method);

      if (requireLoginForMethod && !session) {
        throw new UnauthorizedError("Unauthorized. You must be signed in");
      }

      if (req.method && !methods.includes(req.method as Method)) {
        throw new MethodNotAllowedError(
          "Method Not Allowed. Please try request with correct method"
        );
      }

      await handler(req, res, session);
    } catch (err) {
      //TODO: send error to sentry (client side not showing error)
      console.error(err);

      if (err instanceof ApiError) {
        console.error(
          `Error in ${handler.name}, Error occurred on endpoint: ${err.endpoint}`
        );
        if (err.redirectUrl) {
          return res.status(307).json({
            statusCode: 307,
            message: err.message,
            redirectUrl: err.redirectUrl,
          });
        }

        return res
          .status(err.statusCode || 500)
          .json({ statusCode: err.statusCode || 500, message: err.message });
      }

      return res
        .status(500)
        .json({ statusCode: 500, message: "Internal Server Error" });
    }
  };
}
