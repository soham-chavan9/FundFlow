"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Wordmark } from "@/components/brand";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import type { CurrentUser } from "@/lib/types";
import { PRIMARY_NAV, SECONDARY_NAV, SETTINGS_NAV, type NavItem } from "./nav-items";
import { UserMenu } from "./user-menu";

function NavLinks({ items }: { items: NavItem[] }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const month = useSearchParams().get("month");
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const href = item.monthScoped && month ? `${item.href}?month=${month}` : item.href;
        return (
          <SidebarMenuItem key={item.key}>
            <SidebarMenuButton asChild isActive={active} tooltip={t(item.key)}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => isMobile && setOpenMobile(false)}
              >
                <item.icon />
                <span>{t(item.key)}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function AppSidebar({ user }: { user: CurrentUser }) {
  const t = useTranslations("nav");
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="h-14 justify-center px-3">
        <Link
          href="/dashboard"
          className="rounded-md group-data-[collapsible=icon]:[&_span:last-child]:hidden"
        >
          <Wordmark />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label={t("label")} className="contents">
          <SidebarGroup>
            <SidebarGroupContent>
              <NavLinks items={PRIMARY_NAV} />
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupContent>
              <NavLinks items={SECONDARY_NAV} />
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <NavLinks items={[SETTINGS_NAV]} />
        <UserMenu user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
