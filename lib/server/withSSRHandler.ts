import { ToastKindType } from "@/components/ui/Toast";
import {
  AUTH_EXPECTED_ERROR,
  AUTH_QUERY_PARAMS,
} from "@/constants/errorMessage/auth";
import { COMMON_ERROR } from "@/constants/errorMessage/client";
import {
  AUTH_URL,
  NEXT_JS_INTERNAL_PREFIX,
  RESTAURANT_URL,
} from "@/constants/url";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { GetServerSidePropsContext } from "next";
import { Session, getServerSession } from "next-auth";
import { ApiError } from "../shared/error/ApiError";
import { RESTAURANT_SETUP_STEPS } from "@/constants/status";
import isPreviousStep from "@/utils/validation/isPreviousStep";

export interface InitialMessage {
  message: string;
  type: ToastKindType;
}

type Fetcher = (session?: Session) => Promise<any>;

type GetServerSidePropsOptions = {
  fetchers?: { [key: string]: Fetcher };
  callback?: (
    session?: Session,
    fallback?: { [key: string]: any }
  ) => Promise<{ [key: string]: any }>;
};

export default async function withSSRHandler(
  ctx: GetServerSidePropsContext,
  options?: GetServerSidePropsOptions
) {
  let initMsg: InitialMessage | null = null;
  try {
    const session: Session | null = await getServerSession(
      ctx.req,
      ctx.res,
      authOptions
    );

    if (!session) {
      return {
        redirect: {
          destination: `${AUTH_URL.LOGIN}?${AUTH_QUERY_PARAMS.ERROR}=${AUTH_EXPECTED_ERROR.UNAUTHORIZED}`,
          permanent: false,
        },
      };
    }

    const sessionResult = await handleSession(ctx, session);
    if (sessionResult) return sessionResult;

    if (session.message && ctx.req.url === session.redirectUrl) {
      initMsg = {
        type: "info",
        message: session.message,
      };
    }

    if (!options) {
      return {
        props: {
          initMsg,
        },
      };
    }

    const fetchers = options.fetchers || {};
    const fetchedData = await Promise.all(
      Object.values(fetchers).map((fetcher) => fetcher(session))
    );

    const fallback = Object.fromEntries(
      Object.keys(fetchers).map((key, index) => [key, fetchedData[index]])
    );

    return {
      props: {
        fallback,
        initMsg,
        ...(options.callback ? await options.callback(session, fallback) : {}),
      },
    };
  } catch (err) {
    // TODO: Send error to Sentry
    const errMessage =
      err instanceof ApiError ? err.message : COMMON_ERROR.UNEXPECTED;
    console.error(err);
    return {
      props: {
        fallback: Object.fromEntries(
          Object.keys(options?.fetchers || {}).map((key) => [key, null])
        ),
        initMsg: {
          type: "error",
          message: errMessage,
        },
      },
    };
  }
}

async function handleSession(
  ctx: GetServerSidePropsContext,
  session: Session | null
): Promise<any> {
  if (!session) {
    return {
      redirect: {
        destination: `${AUTH_URL.LOGIN}?${AUTH_QUERY_PARAMS.ERROR}=${AUTH_EXPECTED_ERROR.UNAUTHORIZED}`,
        permanent: false,
      },
    };
  }

  if (session.redirectUrl && ctx.req.url !== session.redirectUrl) {
    if (!ctx.req.url?.startsWith(NEXT_JS_INTERNAL_PREFIX)) {
      if (!ctx.req.url?.startsWith(RESTAURANT_URL.SETUP.BASE)) {
        return {
          redirect: {
            destination: session.redirectUrl,
            permanent: false,
          },
        };
      }

      const isPrevStep = isPreviousStep(
        RESTAURANT_SETUP_STEPS,
        ctx.req.url,
        session.redirectUrl
      );

      if (!isPrevStep) {
        return {
          redirect: {
            destination: session.redirectUrl,
            permanent: false,
          },
        };
      }
    }
  }

  return null;
}
