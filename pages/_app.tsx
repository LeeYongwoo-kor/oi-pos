import MessageContainer from "@/components/ui/Message";
import ToastContainer from "@/components/ui/Toast";
import { ERROR_RETRY_COUNT, ERROR_RETRY_DELAY } from "@/constants/numeric";
import { CustomErrorType } from "@/lib/shared/error/CustomError";
import { ErrorProvider } from "@/providers/ErrorContext";
import { LoadingProvider } from "@/providers/LoadingContext";
import { NavigationProvider } from "@/providers/NavigationContext";
import "@/styles/globals.css";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import ReactModal from "react-modal";
import { RecoilRoot } from "recoil";
import { SWRConfig } from "swr";

ReactModal.setAppElement("#__next");

export async function fetcher<T>(url: string): Promise<T> {
  return fetch(url).then(async (res) => {
    if (!res.ok) {
      const errorMessage: CustomErrorType = await res.json();
      throw errorMessage;
    }
    return res.json();
  });
}

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <RecoilRoot>
      {/* <WebSocketProvider> */}
      <ErrorProvider>
        <LoadingProvider>
          <SWRConfig
            value={{
              fetcher,
              onErrorRetry(
                err: CustomErrorType,
                key,
                config,
                revalidate,
                { retryCount }
              ) {
                // Never retry on not 5xx errors
                if (!String(err?.statusCode).startsWith("5")) return;

                // Only retry up to 5 times
                if (retryCount >= ERROR_RETRY_COUNT) return;

                // Retry after 1 second
                setTimeout(() => revalidate({ retryCount }), ERROR_RETRY_DELAY);
              },
            }}
          >
            <SessionProvider session={session}>
              <PageComponent Component={Component} pageProps={pageProps} />
            </SessionProvider>
          </SWRConfig>
        </LoadingProvider>
      </ErrorProvider>
      {/* </WebSocketProvider> */}
    </RecoilRoot>
  );
}

const PageComponent = ({
  Component,
  pageProps,
}: {
  Component: any;
  pageProps: any;
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <NavigationProvider>
        <Component {...pageProps} />
        <ToastContainer />
        <MessageContainer />
      </NavigationProvider>
    </LocalizationProvider>
  );
};
