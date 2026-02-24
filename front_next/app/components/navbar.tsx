import { Avatar, Dropdown, Label, toast } from "@heroui/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { verifyToken } from "../api";
import { UserPlain } from "../typings";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { userAtom } from "../store";

export interface NavbarProps {
  data: {
    label: string;
    to: string;
    onClick?: (to: string) => void;
  }[];
}

export function Navbar({ data }: NavbarProps) {
  const router = useRouter();
  const [user, setUser] = useAtom(userAtom);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      verifyToken(token)
        .then((data) => {
          setUser(data as UserPlain);
        })
        .catch((error) => {
          toast.danger(`获取登录信息失败: ${error.message}`);
          localStorage.removeItem("token");
        });
    }
  }, [])

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
              <Avatar.Fallback>{user?.nickname?.slice(0, 2) || user?.name?.slice(0, 2) || user?.email?.slice(0, 2)}</Avatar.Fallback>
            </Avatar>
          </Dropdown.Trigger>
          <Dropdown.Popover>
            <Dropdown.Menu onAction={(key) => {
              switch (key) {
                case "logout":
                  if (window.confirm("确定要注销登录吗？")) {
                    localStorage.removeItem("token");
                    setUser(null);
                    router.push("/login");
                  }
                  break;
                default:
                  console.log(key);
              }
            }}>
              <Dropdown.Item id="user-info" textValue="user-info">
                <div>
                  <div>
                    <Label>{user?.name?.toUpperCase()}</Label>
                  </div>
                  <div>
                    <Label className="text-xs text-muted">{user?.email}</Label>
                  </div>
                </div>
              </Dropdown.Item>
              <Dropdown.Item id="logout" textValue="logout" variant="danger">
                <Label>注销登录</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </nav>
  );
}
