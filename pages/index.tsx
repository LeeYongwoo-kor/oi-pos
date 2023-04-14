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
        destination: "/dashboard",
      },
    };
  }

  return {
    redirect: {
      destination: "/auth/signin",
    },
  };
}
