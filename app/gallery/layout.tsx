"use client";
import { MOBILE_HEADER_HEIGHT, BROWSER_HEADER_HEIGHT } from "../config";
import { useEffect, useState } from "react";

export default function GalleryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [headerHeight, setHeaderHeight] = useState(BROWSER_HEADER_HEIGHT);

  useEffect(() => {
    setHeaderHeight(window.innerWidth < 768 ? MOBILE_HEADER_HEIGHT : BROWSER_HEADER_HEIGHT);
  }, []);

  return (
    <div style={{ paddingTop: headerHeight }}>
      {children}
    </div>
  );
}
