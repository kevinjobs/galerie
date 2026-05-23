"use client";
import { Bars } from "@gravity-ui/icons";
import { Avatar, Button, Dropdown, Label, toast } from "@heroui/react";
import { useAtom } from "jotai";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { verifyToken } from "../api";
import { settingAtom, tokenAtom, userAtom } from "../store";
import { Setting, UserPlain } from "../typings";
import { MOBILE_HEADER_HEIGHT, BROWSER_HEADER_HEIGHT } from "../config";

export interface NavbarProps {
  data: {
    label: string;
    to: string;
    onClick?: (to: string) => void;
  }[];
}

export function Navbar({ data }: NavbarProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
  }, []);

  // 避免 hydration mismatch：首次渲染用通用占位
  if (!mounted) {
    return (
      <nav className="flex h-full w-200 items-center mx-auto">
        <div className="hinter-logo">
          <h1 className="text-2xl font-bold">
            <Link href="/" className="text-black dark:text-white">
              Gelerie
            </Link>
          </h1>
        </div>
        <div className="hinter-navbar-center mx-8 grow">
          {data?.map((item) => (
            <Link key={item.label} href={item.to} className="mx-8">
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    );
  }

  return isMobile ? <MobileNav data={data} /> : <BrowserNav data={data} />;
}

function BrowserNav({ data }: NavbarProps) {
  const [user, setUser] = useAtom(userAtom);
  const [token, setToken] = useAtom(tokenAtom);
  const router = useRouter();

  return (
    <nav className="flex h-full w-200 items-center mx-auto">
      <div className="hinter-logo">
        <h1 className="text-2xl font-bold">
          <Link href="/" className="text-black dark:text-white">
            Gelerie
          </Link>
        </h1>
      </div>
      <div className="hinter-navbar-center mx-8 grow">
        {data?.map((item) => (
          <Link key={item.label} href={item.to} className="mx-8">
            {item.label}
          </Link>
        ))}
      </div>
      <div className="hinter-navbar-right">
        <Dropdown>
          <Dropdown.Trigger>
            <Avatar>
              <Avatar.Fallback>
                {
                  user?.name?.toUpperCase()?.slice(0, 1) ||
                  user?.email?.toUpperCase()?.slice(0, 2)}
              </Avatar.Fallback>
            </Avatar>
          </Dropdown.Trigger>
          <Dropdown.Popover>
            <Dropdown.Menu
              onAction={(key) => {
                switch (key) {
                  case "logout":
                    if (window.confirm("确定要注销登录吗？")) {
                      setToken(null);
                      setUser(null);
                      router.push("/login");
                    }
                    break;
                }
              }}
            >
              <Dropdown.Item id="user-info" textValue="user-info">
                <div>
                  <div>
                    <Label>{user?.name?.toUpperCase()}</Label>
                  </div>
                  <div>
                    <Label className="text-xs text-muted">
                      {user?.email}
                    </Label>
                  </div>
                </div>
              </Dropdown.Item>
              <Dropdown.Item
                id="logout"
                textValue="logout"
                variant="danger"
              >
                <Label>注销登录</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </nav>
  )
}


function MobileNav({ data }: NavbarProps) {
  const [user, setUser] = useAtom(userAtom);
  const [token, setToken] = useAtom(tokenAtom);
  const router = useRouter();

  return (
    <nav className="h-full w-full">
      <header className="h-full w-full flex items-center">
        <div className="ml-4 inline-block h-8">
          {user ?
            (
              <Dropdown>
                <Dropdown.Trigger>
                  <Avatar size="sm">
                    <Avatar.Fallback>
                      {user?.name?.toUpperCase()?.slice(0, 1) || user?.email?.toUpperCase()?.slice(0, 2)}
                    </Avatar.Fallback>
                  </Avatar>
                </Dropdown.Trigger>
                <Dropdown.Popover>
                  <Dropdown.Menu
                    onAction={(key) => {
                      switch (key) {
                        case "logout":
                          if (window.confirm("确定要注销登录吗？")) {
                            setToken(null);
                            setUser(null);
                            router.push("/login");
                          }
                          break;
                      }
                    }}
                  >
                    <Dropdown.Item id="user-info" textValue="user-info">
                      <div>
                        <div>
                          <Label>{user?.name?.toUpperCase()}</Label>
                        </div>
                        <div>
                          <Label className="text-xs text-muted">
                            {user?.email}
                          </Label>
                        </div>
                      </div>
                    </Dropdown.Item>
                    <Dropdown.Item
                      id="logout"
                      textValue="logout"
                      variant="danger"
                    >
                      <Label>注销登录</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            ) : (<Avatar size="sm">
              <Avatar.Fallback>
                <Link href="/login">登录</Link>
              </Avatar.Fallback>
            </Avatar>)}
        </div>
        <div className="grow"></div>
        <div className="pr-4">
          <Dropdown>
            <Dropdown.Trigger>
              <Bars width={32} height={32} />
            </Dropdown.Trigger>
            <Dropdown.Popover>
              <Dropdown.Menu
                onAction={(key) => {
                  switch (key) {
                    case "home":
                      router.push("/")
                      break;
                    case "gallery":
                      router.push("/gallery")
                      break;
                    case "map":
                      router.push("/map")
                      break;
                    case "hinter":
                      router.push("/hinter")
                      break;
                  }

                }}
              >
                <Dropdown.Item id="home" textValue="home">
                  <Label className="px-4">
                    首页
                  </Label>
                </Dropdown.Item>
                <Dropdown.Item id="gallery" textValue="gallery">
                  <Label className="px-4">
                    相册
                  </Label>
                </Dropdown.Item>
                <Dropdown.Item id="map" textValue="map">
                  <Label className="px-4">地图</Label>
                </Dropdown.Item>
                <Dropdown.Item id="hinter" textValue="hinter">
                  <Label className="px-4">管理</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </header>

    </nav>
  );
}
