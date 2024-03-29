import { AUTH_EXPECTED_ERROR } from "@/constants/errorMessage/auth";
import { AUTH_URL } from "@/constants/url";
import { useError } from "@/providers/ErrorContext";
import { GetServerSideProps } from "next";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useSWRConfig } from "swr";

type ErrorPageProps = {
  errorName: string;
  errorMessage?: string;
};

export default function ErrorPage({ errorName, errorMessage }: ErrorPageProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { setError } = useError();

  useEffect(() => {
    if (errorName) {
      setError({ errorName, errorMessage });
      // clear cache on logout
      mutate(() => true, undefined, { revalidate: false });
      signOut({ redirect: false }).then(() => {
        router.replace(AUTH_URL.LOGIN);
      });
    }
  }, [errorName, errorMessage, setError, router]);

  return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const errorName = context.params?.errorName;
  const { errorMessage = null, allowAccess } = context.query;

  if (!errorName) {
    return {
      props: {
        errorName: AUTH_EXPECTED_ERROR.INVALID_ERROR,
      },
    };
  }

  if (!allowAccess) {
    return {
      props: {
        errorName: AUTH_EXPECTED_ERROR.NOT_ALLOWED_ACCESS,
      },
    };
  }

  if (allowAccess !== "true") {
    return {
      props: {
        errorName: AUTH_EXPECTED_ERROR.NOT_ALLOWED_ACCESS,
      },
    };
  }

  return {
    props: { errorName, errorMessage },
  };
};
