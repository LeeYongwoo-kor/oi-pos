import { JWT } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

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
          `/errors/${token.errorName}?errorMessage=${token.message}&allowAccess=true`,
          req.url
        )
      );
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }: IAuthorizedOptions) {
        console.log("this is middleware callbacks");
        console.log("Request received:", req.url);
        // `/admin` requires admin role
        // if (req.nextUrl.pathname === "/admin") {
        //   return token?.userRole === "admin";
        // }
        return !!token;
      },
    },
  }
);

export const config = { matcher: ["/plans/:path*", "/dashboard"] };
