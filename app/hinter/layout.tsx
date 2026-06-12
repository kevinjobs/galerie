"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MOBILE_HEADER_HEIGHT, BROWSER_HEADER_HEIGHT } from "../config";
import { Picture, Person, Gear, PersonPencil } from "@gravity-ui/icons";
import { useEffect, useState } from "react";
import { usePermission } from "@/app/hooks/usePermission";
import { Spinner } from "@heroui/react";

const menuItems = [
  {
    href: "/hinter/photo",
    label: "照片管理",
    description: "浏览与上传图库照片",
    shortLabel: "照片",
    icon: Picture,
    requiredPermission: "photo.get",
  },
  {
    href: "/hinter/user",
    label: "用户管理",
    description: "查看与编辑用户信息",
    shortLabel: "用户",
    icon: Person,
    requiredPermission: "user.get",
  },
  {
    href: "/hinter/setting",
    label: "杂项",
    description: "系统主题、语言与存储选项",
    shortLabel: "杂项",
    icon: Gear,
    // Personal preferences - accessible to all authenticated users
  },
  {
    href: "/hinter/profile",
    label: "个人资料",
    description: "账户资料与安全操作",
    shortLabel: "资料",
    icon: PersonPencil,
    // No permission requirement - any authenticated user can access
  },
];

export default function HinterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user, hasPermission } = usePermission();

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && !user) {
      router.push("/login");
    }
  }, [mounted, user, router]);

  const headerHeight = mounted && isMobile ? MOBILE_HEADER_HEIGHT : BROWSER_HEADER_HEIGHT;

  const isActive = (href: string) => {
    if (href === "/hinter/photo") {
      return pathname.startsWith("/hinter/photo");
    }
    return pathname === href;
  };

  // Filter menu items based on permissions
  const filteredMenuItems = menuItems.filter((item) => {
    if (item.requiredPermission) {
      return hasPermission(item.requiredPermission);
    }
    return true; // No requirement = visible to all authenticated users
  });

  // Show loading state
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Show redirect state
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="hinter min-h-screen" style={{ paddingTop: headerHeight }}>
      <div className="mx-auto flex max-w-[1200px] gap-6 px-4 pb-8 pt-4">
        <aside className="hidden w-64 shrink-0 flex-col gap-4 lg:flex">
          <div className="rounded-3xl bg-background p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-muted">Hinter 控制台</p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">导航菜单</h2>
            <p className="mt-1 text-sm text-muted">选择模块进入对应管理界面。</p>
          </div>

          <nav className="flex flex-col gap-2">
            {filteredMenuItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-200 ${
                    active
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-transparent text-muted hover:border-border hover:bg-muted/5 hover:text-foreground"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                  )}
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    active ? "bg-primary/15 text-primary" : "bg-muted/10 text-muted group-hover:bg-muted/20"
                  }`}>
                    <Icon width={18} height={18} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{item.label}</div>
                    <p className="mt-0.5 truncate text-xs text-muted">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 rounded-3xl bg-background p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-lg lg:hidden">
        <div className="flex justify-around py-2">
          {filteredMenuItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center gap-1 px-3 py-1.5 text-xs transition-colors ${
                  active ? "text-primary" : "text-muted hover:text-foreground"
                }`}
              >
                {active && (
                  <span className="absolute -top-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-primary" />
                )}
                <span className={`flex items-center justify-center rounded-xl transition-colors ${
                  active ? "bg-primary/15" : ""
                }`}>
                  <Icon width={20} height={20} />
                </span>
                <span>{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="h-20 lg:hidden" />
    </div>
  );
}
