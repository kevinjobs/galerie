"use client";

import Link from "next/link";

const cards = [
  {
    href: "/hinter/photo",
    title: "照片管理",
    description: "浏览、上传与编辑图库照片。",
  },
  {
    href: "/hinter/user",
    title: "用户管理",
    description: "管理用户列表和权限。",
  },
  {
    href: "/hinter/setting",
    title: "杂项",
    description: "调整主题、语言和存储选项。",
  },
  {
    href: "/hinter/profile",
    title: "个人资料",
    description: "查看账户信息并执行安全操作。",
  },
];

export default function HinterPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-muted">欢迎</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">Hinter 控制台</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
          请选择左侧菜单中的模块来访问照片、用户、杂项和个人资料功能。此页面也可以通过下方卡片快速进入对应界面。
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-3xl border border-border bg-surface p-5 transition hover:border-primary hover:bg-primary/5"
          >
            <h2 className="text-xl font-semibold text-foreground">{card.title}</h2>
            <p className="mt-2 text-sm text-muted">{card.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
