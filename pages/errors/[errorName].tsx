import { useError } from "@/providers/ErrorContext";
import { GetServerSideProps } from "next";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

type ErrorPageProps = {
  errorName: string;
  message?: string;
};

export default function ErrorPage({ errorName, message }: ErrorPageProps) {
  const router = useRouter();
  const { setError } = useError();

  useEffect(() => {
    if (errorName) {
      setError({ errorName, errorMessage: message });
      signOut({ redirect: false }).then(() => {
        router.replace("/auth/signin");
      });
    }
  }, [errorName, message, setError, router]);

  return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const errorName = context.params?.errorName;
  const { message = null, allowAccess } = context.query;

  if (!errorName) {
    return {
      props: {
        errorName: "InvalidError",
      },
    };
  }

  if (!allowAccess) {
    return {
      props: {
        errorName: "NotAllowedAccess",
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
    props: { errorName, message },
  };
};
