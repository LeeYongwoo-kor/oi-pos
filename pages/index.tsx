import { AUTH_URL, DASHBOARD_URL } from "@/constants/url";
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]";

export default function Home() {
  return <div>This is my home</div>;
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);

  if (session) {
    return {
      redirect: {
        destination: DASHBOARD_URL.BASE,
      },
    };
  }

  return {
    redirect: {
      destination: AUTH_URL.LOGIN,
    },
  };
}
