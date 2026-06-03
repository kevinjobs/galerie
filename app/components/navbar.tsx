"use client";
import { Bars, Xmark, House, Picture, MapPin, Gear, ArrowRightFromSquare } from "@gravity-ui/icons";
import { Avatar, toast } from "@heroui/react";
import { useAtom } from "jotai";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { verifyToken, genSrc } from "../api";
import { settingAtom, tokenAtom, userAtom } from "../store";
import { Setting, UserPlain } from "../typings";
import { MOBILE_HEADER_HEIGHT } from "../config";
import { Logo } from "./logo";

export interface NavbarProps {
  data: {
    label: string;
    to: string;
    onClick?: (to: string) => void;
  }[];
}

export function Navbar({ data }: NavbarProps) {
  const [token] = useAtom(tokenAtom);
  const setUser = useAtom(userAtom)[1];
  const setSetting = useAtom(settingAtom)[1];

  useEffect(() => {
    if (token) {
      verifyToken(token)
        .then((data) => {
          setUser(data as UserPlain);
          setSetting(data.setting as Setting);
        })
        .catch((error) => {
          toast.danger(`获取登录信息失败: ${error.message}`);
        });
    }
  }, [token, setUser, setSetting]);

  return (
    <>
      {/* 桌面端导航 - md及以上显示 */}
      <div className="hidden md:contents">
        <BrowserNav data={data} />
      </div>
      {/* 移动端导航 - md以下显示 */}
      <div className="h-full w-full md:hidden">
        <MobileNav data={data} />
      </div>
    </>
  );
}

function BrowserNav({ data }: NavbarProps) {
  return (
    <nav className="flex h-full w-200 items-center mx-auto">
      <div className="hinter-logo">
        <Link href="/">
          <Logo variant="D" />
        </Link>
      </div>
      <div className="hinter-navbar-center mx-8 grow">
        {data?.map((item) => (
          <Link key={item.label} href={item.to} className="mx-8">
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}


function MobileNav(_props: NavbarProps) {
  const [user, setUser] = useAtom(userAtom);
  const [token, setToken] = useAtom(tokenAtom);
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // 打开：先渲染 DOM（关闭态），下一帧再设为打开态触发过渡
  const handleOpen = () => {
    setShouldRender(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMenuOpen(true));
    });
  };

  // 关闭：先设为关闭态触发过渡，动画结束后卸载 DOM
  const handleClose = () => {
    setMenuOpen(false);
    setTimeout(() => setShouldRender(false), 300);
  };

  // 路径变化时自动关闭菜单
  useEffect(() => {
    if (menuOpen) handleClose();
  }, [pathname]);

  const navItems = [
    { key: "/", label: "Home", icon: House },
    { key: "/gallery", label: "Gallery", icon: Picture },
    { key: "/map", label: "Map", icon: MapPin },
    { key: "/hinter", label: "Hinter", icon: Gear },
  ];

  const handleNav = (to: string) => {
    handleClose();
    router.push(to);
  };

  const handleLogout = () => {
    handleClose();
    if (window.confirm("确定要注销登录吗？")) {
      setToken(null);
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <>
      <nav className="h-full w-full flex items-center justify-end px-4">
        {/* 右侧汉堡按钮 */}
        <button onClick={handleOpen} className="p-1">
          <Bars width={24} height={24} />
        </button>
      </nav>

      {/* 全屏菜单覆盖层 - 通过 Portal 渲染到 body，避免 header backdrop-filter 的包含块截断 */}
      {shouldRender && createPortal(
        <div
          className={`fixed inset-0 z-50 flex flex-col backdrop-blur-2xl transition-all duration-300 ease-out ${menuOpen ? "opacity-100" : "opacity-0"
            }`}
          style={{ backgroundColor: "color-mix(in srgb, var(--background) 92%, transparent)" }}
        >
          {/* 顶部栏：品牌 + 关闭按钮 */}
          <div
            className={`flex items-center justify-between px-4 pt-2 pl-8 transition-all duration-300 ease-out ${menuOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
              }`}
            style={{ height: MOBILE_HEADER_HEIGHT, transitionDelay: menuOpen ? "50ms" : "0ms" }}
          >
            <Logo variant="D" />
            <button onClick={handleClose} className="p-1">
              <Xmark width={24} height={24} />
            </button>
          </div>

          {/* 导航项 */}
          <div className="flex-1 flex flex-col items-center justify-center gap-2 px-8">
            {navItems.map((item, i) => {
              const isActive = pathname === item.key || (item.key !== "/" && pathname.startsWith(item.key));
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNav(item.key)}
                  className={`w-full flex items-center gap-4 rounded-2xl px-6 py-4 text-lg font-medium transition-all duration-300 ease-out ${menuOpen
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                    } ${isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted/10"
                    }`}
                  style={{ transitionDelay: menuOpen ? `${100 + i * 50}ms` : "0ms" }}
                >
                  <Icon width={22} height={22} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* 底部用户信息 + 退出 */}
          <div
            className={`border-t border-border px-6 py-5 transition-all duration-300 ease-out ${menuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            style={{ transitionDelay: menuOpen ? "300ms" : "0ms" }}
          >
            {user ? (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleNav("/hinter/profile")}
                  className="flex items-center gap-3 min-w-0 opacity-70 hover:opacity-100 transition-opacity"
                >
                  <Avatar size="sm">
                    {user?.avatar && <Avatar.Image src={genSrc(user.avatar)} />}
                    <Avatar.Fallback>
                      {user?.name?.toUpperCase()?.slice(0, 1) || user?.email?.toUpperCase()?.slice(0, 2)}
                    </Avatar.Fallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user?.nickname || user?.name || "Unnamed User"}
                    </p>
                    <p className="truncate text-xs text-muted">{user?.email}</p>
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
                >
                  <ArrowRightFromSquare width={16} height={16} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNav("/login")}
                className="w-full rounded-2xl bg-primary py-3 text-center text-sm font-medium text-white"
              >
                Login
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
