import useError from "@/hooks/context/useError";
import { hasNullUndefined } from "@/utils/checkNullUndefined";
import { GetServerSideProps } from "next";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

type ErrorPageProps = {
  errorName: string;
  errorMessage?: string;
};

export default function ErrorPage({ errorName, errorMessage }: ErrorPageProps) {
  const router = useRouter();
  const { setError } = useError();

  useEffect(() => {
    if (errorName) {
      setError({ errorName, errorMessage });
      signOut({ redirect: false }).then(() => {
        router.push("/auth/signin");
      });
    }
  }, [errorName, errorMessage, setError, router]);

  return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const errorName = context.params?.errorName;
  const { errorMessage = null, allowAccess } = context.query;

  if (hasNullUndefined({ errorName, allowAccess })) {
    return {
      props: {
        errorName: "InvalidError",
      },
    };
  }

  if (allowAccess !== "true") {
    return {
      props: {
        errorName: "NotAllowedAccess",
      },
    };
  }

  return {
    props: { errorName, errorMessage },
  };
};
