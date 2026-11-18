import { Suspense } from "react";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth/dal";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      {/* useSearchParams inside the sidebar needs a boundary */}
      <Suspense>
        <AppSidebar user={user} />
      </Suspense>
      <SidebarInset className="md:border md:shadow-[var(--shadow-soft)]">{children}</SidebarInset>
    </SidebarProvider>
  );
}
