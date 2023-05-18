import ToastHandler from "@/components/handlers/ToastHandler";
import ToastContainer from "@/components/ui/Toast";
import { ERROR_RETRY_COUNT, ERROR_RETRY_DELAY } from "@/constants";
import { ErrorProvider } from "@/context/ErrorContext";
import { MessageProvider } from "@/context/MessageContext";
import { NavigationProvider } from "@/context/NavigationContext";
import { ToastProvider } from "@/context/ToastContext";
import { CustomError, CustomErrorType } from "@/lib/shared/CustomError";
import "@/styles/globals.css";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import ReactModal from "react-modal";
import { SWRConfig } from "swr";

ReactModal.setAppElement("#__next");

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
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
          {/* <AuthProvider requireAuth={requireAuth}> */}
          <NavigationProvider>
            <ToastProvider>
              <MessageProvider>
                <Component {...pageProps} />
                <ToastHandler />
              </MessageProvider>
              <ToastContainer />
            </ToastProvider>
          </NavigationProvider>
          {/* </AuthProvider> */}
        </SessionProvider>
      </SWRConfig>
    </ErrorProvider>
  );
}
