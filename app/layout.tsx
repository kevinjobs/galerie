"use client";
import { Toast } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "./components/navbar";
import "./globals.css";
import { MOBILE_HEADER_HEIGHT, BROWSER_HEADER_HEIGHT } from "./config";
import { useEffect, useState } from "react";

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 首次 SSR 渲染使用桌面版高度，避免 hydration mismatch
  const headerHeight = mounted && isMobile ? MOBILE_HEADER_HEIGHT : BROWSER_HEADER_HEIGHT;

  return (
    <html lang="en" className="dark" data-theme="dark">
      <head>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="initial-scale=1.0, user-scalable=no, width=device-width"
        />
      </head>
      <body className="">
        <Toast.Provider placement="top" />
        <header
          className="galerie-header w-full flex items-center fixed top-0 left-0 backdrop-blur-sm bg-background/0 z-40"
          style={{ height: headerHeight }}
        >
          <Navbar
            data={[
              { label: "Home", to: "/" },
              { label: "Gallery", to: "/gallery" },
              { label: "Map", to: "/map" },
              { label: "Hinter", to: "/hinter" },
            ]}
          />
        </header>
        <QueryClientProvider client={queryClient}>
          <div className="galerie-main w-full max-w-full">
            {children}
            {modal}
          </div>
        </QueryClientProvider>
      </body>
    </html>
  );
}
