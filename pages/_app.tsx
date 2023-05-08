import ToastHandler from "@/components/handler/ToastHandler";
import ToastContainer from "@/components/ui/Toast";
import { ErrorProvider } from "@/context/ErrorContext";
import { MessageProvider } from "@/context/MessageContext";
import { NavigationProvider } from "@/context/NavigationContext";
import { ToastProvider } from "@/context/ToastContext";
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
    <SWRConfig
      value={{ fetcher: (url: string) => fetch(url).then((res) => res.json()) }}
    >
      <ErrorProvider>
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
      </ErrorProvider>
    </SWRConfig>
  );
}
