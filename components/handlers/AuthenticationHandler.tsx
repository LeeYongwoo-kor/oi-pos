import { useToast } from "@/hooks/useToast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

const AuthenticationHandler = () => {
  const { data: session, status } = useSession();
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const message = session?.message;
    const redirectUrl = session?.redirectUrl;

    if (status === "authenticated") {
      if (message && redirectUrl) {
        router.replace(redirectUrl).then(() => {
          addToast("info", message);
        });
      }
    }
  }, [session?.redirectUrl, status]);

  return null;
};

export default AuthenticationHandler;
