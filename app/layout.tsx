"use client";
import { Toast } from "@heroui/react";
import { Navbar } from "./components/navbar";
import "./globals.css";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isMapPage = pathname === "/map";
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en" className="dark" data-theme="dark">
      <head>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="initial-scale=1.0, user-scalable=no, width=device-width"
        />
        {/* PWA: iOS 兼容 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Galerie" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        {/* PWA: theme-color */}
        <meta name="theme-color" content="#000000" />
        {/* PWA: Service Worker 注册 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(
                    reg => console.log('SW registered:', reg.scope),
                    err => console.log('SW registration failed:', err)
                  );
                });
              }
            `,
          }}
        />
      </head>
      <body className="">
        <Toast.Provider placement="top" />
        <header
          className={`galerie-header w-full flex items-center fixed top-0 left-0 z-40 transition-all duration-300 ${
            isMapPage
              ? "bg-transparent"
              : "backdrop-blur-sm bg-background/0"
          }`}
          style={{ height: "var(--header-height)" }}
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
