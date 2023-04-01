import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";

const Signin = () => {
  return <div>Processing login...</div>;
};

export default Signin;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (session) {
    return { redirect: { destination: "/dashboard" } };
  }

  return { redirect: { destination: "/", permanent: true } };
}
