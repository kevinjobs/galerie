"use client";
import { MOBILE_HEADER_HEIGHT, BROWSER_HEADER_HEIGHT } from "../config";
import { isMobile } from "react-device-detect";


export default function HinterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerHeight = isMobile ? MOBILE_HEADER_HEIGHT : BROWSER_HEADER_HEIGHT;
  return (
    <div className="hinter" style={{ paddingTop: headerHeight }}>
      {children}
    </div>
  );
}
