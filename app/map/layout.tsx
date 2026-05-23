"use client";
import { MOBILE_HEADER_HEIGHT, BROWSER_HEADER_HEIGHT } from "../config";
import { useEffect, useState } from "react";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [top, setTop] = useState(BROWSER_HEADER_HEIGHT);

  useEffect(() => {
    setTop(window.innerWidth < 768 ? MOBILE_HEADER_HEIGHT : BROWSER_HEADER_HEIGHT);
  }, []);

  return (
    <div
      className="galerie-map-main"
      style={{
        position: "fixed",
        top,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {children}
    </div>
  );
}
