"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_HEADER_HEIGHT, BROWSER_HEADER_HEIGHT } from "../config";
import { isMobile } from "react-device-detect";

const menuItems = [
  {
    href: "/hinter/photo",
    label: "照片管理",
    description: "浏览与上传图库照片",
    shortLabel: "照片",
  },
  {
    href: "/hinter/user",
    label: "用户管理",
    description: "查看与编辑用户信息",
    shortLabel: "用户",
  },
  {
    href: "/hinter/setting",
    label: "杂项",
    description: "系统主题、语言与存储选项",
    shortLabel: "杂项",
  },
  {
    href: "/hinter/profile",
    label: "个人资料",
    description: "账户资料与安全操作",
    shortLabel: "资料",
  },
];

export default function HinterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const headerHeight = isMobile ? MOBILE_HEADER_HEIGHT : BROWSER_HEADER_HEIGHT;

  return (
    <div className="hinter min-h-screen" style={{ paddingTop: headerHeight }}>
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[1200px] gap-6 px-4 pb-8 pt-4">
        <aside className="hidden w-72 shrink-0 flex-col gap-4 rounded-3xl border border-border bg-surface p-4 shadow-sm md:flex">
          <div className="space-y-2 rounded-3xl bg-background p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-muted">Hinter 控制台</p>
            <h2 className="text-lg font-semibold text-foreground">快速入口</h2>
            <p className="text-sm text-muted">从左侧菜单切换模块，右侧展示当前界面内容。</p>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-3xl border px-4 py-4 transition ${
                    active
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-transparent text-muted hover:border-border hover:bg-muted/10 hover:text-foreground"
                  }`}
                >
                  <div className="font-medium">{item.label}</div>
                  <p className="mt-1 text-sm text-muted">{item.description}</p>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 rounded-3xl border border-border bg-surface p-4 shadow-sm">
          {children}
        </main>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-lg z-30">
        <div className="flex justify-around py-3">
          {menuItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-center text-xs transition ${
                  active ? "text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                {item.shortLabel}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="md:hidden h-16" />
    </div>
  );
}
