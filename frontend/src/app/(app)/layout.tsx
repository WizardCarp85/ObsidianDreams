import { Sidebar, MobileTabBar } from "@/components/Navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <MobileTabBar />
      <main className="app-content fade-up">{children}</main>
    </>
  );
}
