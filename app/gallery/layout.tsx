"use client";
import { isMobile } from "react-device-detect";
import { MOBILE_HEADER_HEIGHT, BROWSER_HEADER_HEIGHT } from "../config";

export default function GalleryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div style={{ paddingTop: isMobile ? MOBILE_HEADER_HEIGHT : BROWSER_HEADER_HEIGHT }}>
      {children}
    </div>
  );
}
