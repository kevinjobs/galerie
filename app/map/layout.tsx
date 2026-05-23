"use client";
import { isMobile } from "react-device-detect";
import { MOBILE_HEADER_HEIGHT, BROWSER_HEADER_HEIGHT } from "../config";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className="galerie-map-main"
      style={{
        position: "fixed",
        top: isMobile ? MOBILE_HEADER_HEIGHT : BROWSER_HEADER_HEIGHT,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {children}
    </div>
  );
}
