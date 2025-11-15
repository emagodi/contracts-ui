"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    try {
      const r = localStorage.getItem("roles") || sessionStorage.getItem("roles");
      if (r) {
        const parsed = JSON.parse(r);
        const normalize = (val: unknown): string | null => {
          if (typeof val === "string") {
            const upper = val.toUpperCase();
            return upper.startsWith("ROLE_") ? upper.replace("ROLE_", "") : upper;
          }
          if (val && typeof val === "object") {
            const name = (val as Record<string, unknown>).name;
            if (typeof name === "string") {
              const upper = name.toUpperCase();
              return upper.startsWith("ROLE_") ? upper.replace("ROLE_", "") : upper;
            }
          }
          return null;
        };
        const normalized: string[] = Array.isArray(parsed)
          ? parsed.map((v) => normalize(v)).filter((v): v is string => !!v)
          : [];
        setUserRoles(normalized);
      }
    } catch {}
  }, []);

  useEffect(() => {
    let authed = false;
    try {
      authed =
        localStorage.getItem("auth") === "true" ||
        sessionStorage.getItem("auth") === "true";
    } catch {}
    if (!authed) router.replace("/signin");
  }, [router]);

  useEffect(() => {
    const ALL_ROLES = [
      "ADMIN",
      "PALEGAL",
      "COMPANYSECRETARY",
      "MANAGINGDIRECTOR",
      "PROCUREMENTMANAGER",
      "FINANCEDIRECTOR",
      "TECHNICALDIRECTOR",
      "COMMERCIALDIRECTOR",
      "BUSINESSMANAGER",
      "HOD",
      "USER",
    ];

    const routeRoles: Record<string, string[]> = {
      "/": ALL_ROLES,
      "/calendar": ALL_ROLES,
      "/profile": ALL_ROLES,
      "/form-elements": ALL_ROLES,
      "/basic-tables": ALL_ROLES,
      "/blank": ALL_ROLES,
      "/error-404": ALL_ROLES,
      "/line-chart": ALL_ROLES,
      "/bar-chart": ALL_ROLES,
      "/alerts": ALL_ROLES,
      "/avatars": ALL_ROLES,
      "/badge": ALL_ROLES,
      "/buttons": ALL_ROLES,
      "/images": ALL_ROLES,
      "/videos": ALL_ROLES,
      "/requisition": ["ADMIN", "HOD"],
    };

    const allowed = routeRoles[pathname];
    if (!allowed) return;
    if (userRoles.length === 0) return;
    const ok = allowed.some((r) => userRoles.includes(r));
    if (!ok) router.replace("/error-404");
  }, [pathname, userRoles, router]);

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}
