"use client";
import { Bars, Xmark } from "@gravity-ui/icons";
import { Avatar, Button, Dropdown, Label, toast } from "@heroui/react";
import { useAtom } from "jotai";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import { verifyToken } from "../api";
import { settingAtom, tokenAtom, userAtom } from "../store";
import { Setting, UserPlain } from "../typings";

export interface NavbarProps {
  data: {
    label: string;
    to: string;
    onClick?: (to: string) => void;
  }[];
}

export function Navbar({ data }: NavbarProps) {
  const router = useRouter();

  const [token, setToken] = useAtom(tokenAtom);
  const [user, setUser] = useAtom(userAtom);
  const [setting, setSetting] = useAtom(settingAtom);

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

  return (
    <>
      {isMobile ? <MobileNav data={data} /> : <BrowserNav data={data} />}
    </>
  );
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
            Hinter
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
                  default:
                    console.log(key);
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
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useAtom(userAtom);
  const [token, setToken] = useAtom(tokenAtom);
  const router = useRouter();

  return (
    <nav className="h-full w-full relative">
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
                        default:
                          console.log(key);
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
          {!isOpen ? (
            <Button className="w-8 h-8" isIconOnly variant="ghost" onPress={() => setIsOpen(true)}>
              <Bars width={32} height={32} />
            </Button>
          ) : (
            <Button className="w-8 h-8" isIconOnly variant="ghost" onPress={() => setIsOpen(false)}>
              <Xmark width={32} height={32} />
            </Button>
          )}
        </div>
      </header>
      <div
        className="w-full text-center bg-background overflow-hidden transition-all ease-in-out absolute top-14 left-0 rounded-bottom-2xl z-50"
        style={{
          height: isOpen ? 56 * data.length + 16 : 0,
          paddingBottom: isOpen ? 0 : 0,
        }}
      >
        {data?.map((item) => (
          <div key={item.to} className="h-14 flex items-center justify-center">
            <Link
              key={item.label}
              href={item.to}
              className="mx-8"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          </div>
        ))}
      </div>
    </nav>
  );
}
