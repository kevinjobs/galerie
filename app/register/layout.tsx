"use client";
import { MOBILE_HEADER_HEIGHT, BROWSER_HEADER_HEIGHT } from "../config";
import { useEffect, useState } from "react";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [headerHeight, setHeaderHeight] = useState(BROWSER_HEADER_HEIGHT);

  useEffect(() => {
    setHeaderHeight(window.innerWidth < 768 ? MOBILE_HEADER_HEIGHT : BROWSER_HEADER_HEIGHT);
  }, []);

  return (
    <div
      className="register-page flex justify-center items-center"
      style={{ height: `calc(100vh - ${headerHeight}px)`, marginTop: headerHeight }}
    >
      <div>{children}</div>
    </div>
  );
}
