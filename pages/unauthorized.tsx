import Link from "next/link";

export default function Unauthorized() {
  return (
    <div>
      <h1>Unauthorized</h1>
      <p>You are not authorized to view this page.</p>
      <div>
        <Link href="/">Go Login Page</Link>
      </div>
    </div>
  );
}
