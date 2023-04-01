import Navigation from "@/components/Navigation";
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";

export default function Dashboard(session: any) {
  console.log(session);
  console.log("This is Dashboard");
  return (
    <>
      <Navigation />
      <div>Welcome to Yoshi-POS! You successed login</div>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  console.log(context.req);

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      session,
    },
  };
}
