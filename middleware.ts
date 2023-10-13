import { JWT } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_QUERY_PARAMS } from "./constants/errorMessage/auth";
import { AUTH_ERROR_URL } from "./constants/url";

interface IAuthorizedOptions {
  req: NextRequest;
  token: JWT | null;
}

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: JWT | null } }) {
    const { token } = req.nextauth;

    if (token !== null && token.errorName) {
      return NextResponse.redirect(
        new URL(
          `${AUTH_ERROR_URL.BASE}/${token.errorName}?${AUTH_QUERY_PARAMS.ERROR_MESSAGE}=${token.message}&${AUTH_QUERY_PARAMS.ALLOW_ACCESS}}=true`,
          req.url
        )
      );
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }: IAuthorizedOptions) {
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/plans/:path*",
    "/dashboard",
    "/restaurants/setup/:path*",
    "/tests/:path*",
  ],
};
