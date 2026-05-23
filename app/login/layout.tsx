"use client";
import { isMobile } from "react-device-detect";
import { MOBILE_HEADER_HEIGHT, BROWSER_HEADER_HEIGHT } from "../config";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerHeight = isMobile ? MOBILE_HEADER_HEIGHT : BROWSER_HEADER_HEIGHT;
  return (
    <div
      className="register-page flex justify-center items-center"
      style={{ height: `calc(100vh - ${headerHeight}px)`, marginTop: headerHeight }}
    >
      <div>{children}</div>
    </div>
  );
}
