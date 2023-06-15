import AuthenticationHandler from "@/components/handlers/AuthenticationHandler";
import MessageContainer from "@/components/ui/Message";
import ToastContainer from "@/components/ui/Toast";
import { ERROR_RETRY_COUNT, ERROR_RETRY_DELAY } from "@/constants";
import { CustomErrorType } from "@/lib/shared/CustomError";
import { ErrorProvider } from "@/providers/ErrorContext";
import { NavigationProvider } from "@/providers/NavigationContext";
import "@/styles/globals.css";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import ReactModal from "react-modal";
import { RecoilRoot } from "recoil";
import { SWRConfig } from "swr";

ReactModal.setAppElement("#__next");

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <RecoilRoot>
      <ErrorProvider>
        <SWRConfig
          value={{
            fetcher: (url: string) =>
              fetch(url).then(async (res) => {
                if (!res.ok) {
                  const errorMessage: CustomErrorType = await res.json();
                  throw errorMessage;
                }
                return res.json();
              }),
            onErrorRetry(
              err: CustomErrorType,
              key,
              config,
              revalidate,
              { retryCount }
            ) {
              // Never retry on not 5xx errors
              if (!String(err?.statusCode).startsWith("5")) return;

              // Never retry on /api/v1/users/me
              if (key === "/api/v1/users/me") return;

              // Only retry up to 5 times
              if (retryCount >= ERROR_RETRY_COUNT) return;

              // Retry after 1 second
              setTimeout(() => revalidate({ retryCount }), ERROR_RETRY_DELAY);
            },
          }}
        >
          <SessionProvider session={session}>
            <AuthenticationHandler />
            <NavigationProvider>
              <Component {...pageProps} />
              <ToastContainer />
              <MessageContainer />
            </NavigationProvider>
          </SessionProvider>
        </SWRConfig>
      </ErrorProvider>
    </RecoilRoot>
  );
}
