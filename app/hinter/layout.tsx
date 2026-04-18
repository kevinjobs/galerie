"use client";
import { MOBILE_HEADER_HEIGHT, BROWSER_HEADER_HEIGHT } from "../config";
import { isMobile } from "react-device-detect";


export default function HinterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="hinter pt-2">
      {children}
    </div>
  );
}
