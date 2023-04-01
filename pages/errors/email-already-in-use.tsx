import { useError } from "@/context/error-context";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function EmailAlreadyInUse() {
  const router = useRouter();
  const { setError } = useError();

  // TODO: Hash the URL to prevent direct access
  useEffect(() => {
    setError("email-already-in-use");
    router.replace("/");
  }, [router, setError]);

  return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { query } = context;

  if (!query.allowAccess || query.allowAccess !== "true") {
    return {
      redirect: {
        destination: "/", // Redirect to the home page or any other page if direct access is attempted
        permanent: true,
      },
    };
  }

  return {
    props: {}, // Will be passed to the page component as props
  };
};
