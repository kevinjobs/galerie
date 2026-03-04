"use client";
import { Toast } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "./components/navbar";
import "./globals.css";
import { isMobile, MobileView, BrowserView } from "react-device-detect";

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark max-w-full" data-theme="dark">
      <head>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="initial-scale=1.0, user-scalable=no, width=device-width"
        />
        <script src="https://webapi.amap.com/loader.js"></script>
      </head>
      <body className="max-w-full">
        <Toast.Provider placement="top" />
        <header
          className="w-full flex items-center justify-around absolute top-0"
          style={{ height: isMobile ? 56 : 64 }}
        >
          <Navbar
            data={[
              { label: "Gallery", to: "/gallery" },
              { label: "Map", to: "/map" },
              { label: "Photo", to: "/hinter/photo" },
              { label: "User", to: "/hinter/user" },
              { label: "Setting", to: "/hinter/setting" },
            ]}
          />
        </header>
        <QueryClientProvider client={new QueryClient()}>
          <BrowserView>
            <main className="absolute top-16 w-full max-w-full max-h-[calc(100vh-64px)] overflow-y-auto overflow-x-hidden">
              {children}
              {modal}
            </main>
          </BrowserView>
          <MobileView>
            <main className="absolute top-14 w-full max-w-full max-h-[calc(100vh-56px)] overflow-y-auto overflow-x-hidden">
              {children}
              {modal}
            </main>
          </MobileView>
        </QueryClientProvider>
      </body>
    </html>
  );
}
