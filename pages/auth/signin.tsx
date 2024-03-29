import {
  AUTH_CALLBACK_ERROR_MESSAGE,
  AUTH_EXPECTED_ERROR_MESSAGE,
  AuthCallbackErrorType,
  AuthExpectedErrorType,
} from "@/constants/errorMessage/auth";
import { DASHBOARD_URL } from "@/constants/url";
import useToastAuthError from "@/hooks/context/useToastAuthError";
import { useError } from "@/providers/ErrorContext";
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { signIn } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { authOptions } from "../api/auth/[...nextauth]";

type SigninProps = {
  callbackError: string;
};
interface IEmail {
  email: string;
}

function isExpectedErrorName(name?: string): name is AuthExpectedErrorType {
  return name ? name in AUTH_EXPECTED_ERROR_MESSAGE : false;
}

function getExpectedError(errorName: AuthExpectedErrorType): string {
  return (
    AUTH_EXPECTED_ERROR_MESSAGE[errorName] ||
    AUTH_EXPECTED_ERROR_MESSAGE.DEFAULT
  );
}

const Signin = ({ callbackError }: SigninProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error } = useError();
  const toastAuthError = useToastAuthError();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IEmail>();

  const errorName = error?.errorName;
  const errorMessage = error?.errorMessage;

  const onValid = async ({ email }: IEmail) => {
    setIsSubmitting(true);
    await signIn("email", { email, callbackUrl: "/dashboard" });
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (errorName && isExpectedErrorName(errorName)) {
      toastAuthError(getExpectedError(errorName));
    } else if (errorMessage) {
      toastAuthError(errorMessage);
    }
  }, [errorName, errorMessage]);

  return (
    <main className="moving-background">
      <Head>
        <title>Oi-POS | Login</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="relative z-10 flex items-center justify-center min-h-screen font-archivo bg-opacity-80">
        <div className="w-full max-w-md p-8 shadow-md rounded-xl bg-gray-50">
          <div className="mb-0.5 text-center">
            <Image
              width={192}
              height={192}
              className="mx-auto border rounded-full"
              src="/images/logo/oi-pos.jpg"
              alt="Oi-POS Logo"
              draggable={false}
            />
          </div>
          <form onSubmit={handleSubmit(onValid)}>
            <div className="mb-4">
              <label className="block mb-2 text-lg font-bold text-gray-700 indent-2">
                Email
              </label>
              <input
                disabled={isSubmitting}
                {...register("email", {
                  required: "Write your email please",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                    message: "Invalid email address",
                  },
                })}
                type="email"
                placeholder="Please input email address"
                className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
              {callbackError && (
                <p className="mt-1 text-xs text-red-500">
                  Error: {callbackError}
                </p>
              )}
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>
            <button
              disabled={isSubmitting}
              type="submit"
              className={`w-full px-4 py-2 font-bold text-white bg-blue-500 hover:bg-blue-600 transition-colors rounded focus:outline-none focus:bg-blue-600 ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Email Login
            </button>
          </form>
          <div className="mt-4">
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="flex items-center justify-center w-full px-4 py-2 transition-colors border border-gray-300 rounded hover:bg-blue-100"
            >
              <Image
                width={50}
                height={50}
                className="w-6 h-6 mr-2"
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google logo"
              />
              Sign in with Google
            </button>
          </div>
          <div className="mt-2">
            <button
              onClick={() => signIn("line", { callbackUrl: "/dashboard" })}
              className="flex items-center justify-center w-full px-4 py-2 transition-colors border border-gray-300 rounded hover:bg-blue-100"
            >
              <Image
                width={50}
                height={50}
                className="w-6 h-6 mr-2"
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/LINE_logo.svg/1920px-LINE_logo.svg.png"
                alt="Line logo"
              />
              Sign in with Line
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Signin;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { error } = ctx.query;
  if (error) {
    return {
      props: {
        callbackError:
          AUTH_CALLBACK_ERROR_MESSAGE[error as AuthCallbackErrorType] ??
          AUTH_CALLBACK_ERROR_MESSAGE.DEFAULT,
      },
    };
  }

  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (session) {
    return {
      redirect: {
        destination: DASHBOARD_URL.BASE,
      },
    };
  }

  return { props: {} };
}
