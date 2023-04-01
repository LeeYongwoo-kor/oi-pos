import { signOut, useSession } from "next-auth/react";

export default function Navigation() {
  const { data: session } = useSession();
  if (session) {
    return (
      <nav>
        <div>
          <span>Signed in as {session?.user?.email}</span>
          <span className="ml-3">
            <button onClick={() => signOut()} className="font-bold">
              Sign out
            </button>
          </span>
        </div>
      </nav>
    );
  } else {
    return null;
  }
}
