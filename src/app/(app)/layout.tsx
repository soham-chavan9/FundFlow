import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth/dal";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      {/*
        No Suspense here: the provider switches to the mobile sheet right after
        hydration, and a boundary that hydrated later would then mismatch. The
        layout is dynamic (it reads cookies), so useSearchParams needs none.
      */}
      <AppSidebar user={user} />
      <SidebarInset className="md:border md:shadow-[var(--shadow-soft)]">{children}</SidebarInset>
    </SidebarProvider>
  );
}
