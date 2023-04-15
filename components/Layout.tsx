import { ReactNode } from "react";
import Alarm from "./Alarm";
import NavigationBar from "./NavigationBar";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <NavigationBar />
      <main className="px-4 pt-16">{children}</main>
      <div className="fixed top-0 right-0 h-screen">
        <Alarm />
      </div>
    </div>
  );
}
