import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth";
import { getCsrfToken, getProviders, signIn } from "next-auth/react";
import styles from "../../styles/Signin.module.css";
import { authOptions } from "../api/auth/[...nextauth]";

const Signin = ({
  csrfToken,
  providers,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return (
    <div style={{ overflow: "hidden", position: "relative" }}>
      <div className={styles.wrapper} />
      <div className={styles.content}>
        <div className={styles.cardWrapper}>
          <div className={styles.cardContent}>
            <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
            <button className={styles.primaryBtn}>Submit</button>
            <hr />
            {providers &&
              Object.values(providers).map((provider) => (
                <div key={provider.name} style={{ marginBottom: 0 }}>
                  <button onClick={() => signIn(provider.id)}>
                    Sign in with {provider.name}
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signin;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (session) {
    return { redirect: { destination: "/dashboard" } };
  }

  const providers = await getProviders();
  const csrfToken = await getCsrfToken(context);
  return {
    props: {
      providers,
      csrfToken,
    },
  };
}
