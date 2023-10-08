import { useToast } from "@/hooks/useToast";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

/**
 * Handler component that sets toast message when user is authenticated.
 *
 * @deprecated This Component is deprecated because message is handled by [...nextauth] api and SSR on each page.
 */
const AuthenticationHandler = () => {
  const { data: session, status } = useSession();
  const { addToast } = useToast();

  useEffect(() => {
    const message = session?.message;

    if (status === "authenticated") {
      if (message) {
        addToast("info", message);
      }
    }
  }, [session?.message, status]);

  return null;
};

export default AuthenticationHandler;
