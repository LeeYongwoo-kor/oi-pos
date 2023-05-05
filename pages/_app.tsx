import ToastContainer from "@/components/ui/Toast";
import { AuthProvider } from "@/context/AuthContext";
import { ErrorProvider } from "@/context/ErrorContext";
import { MessageProvider } from "@/context/MessageContext";
import { NavigationProvider } from "@/context/NavigationContext";
import { ToastProvider } from "@/context/ToastContext";
import "@/styles/globals.css";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import ReactModal from "react-modal";
import { SWRConfig } from "swr";

// type AuthComponentProps = {
//   requireAuth?: boolean;
// };

// type AuthComponentType = NextComponentType<
//   NextPageContext,
//   any,
//   AuthComponentProps
// >;

// interface MyAppProps extends AppProps {
//   Component: AuthComponentType;
// }

ReactModal.setAppElement("#__next");

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const requireAuth = Component?.requireAuth || false;

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
