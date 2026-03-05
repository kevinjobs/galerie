"use client";
import { Toast } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserView, isMobile, MobileView } from "react-device-detect";
import { Navbar } from "./components/navbar";
import "./globals.css";
import { MOBILE_HEADER_HEIGHT, BROWSER_HEADER_HEIGHT } from "./config";

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-theme="dark">
      <head>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="initial-scale=1.0, user-scalable=no, width=device-width"
        />
        <script src="https://webapi.amap.com/loader.js"></script>
      </head>
      <body className="">
        <Toast.Provider placement="top" />
        <header
          className="galerie-header w-full flex items-center sticky top-0 left-0 backdrop-blur-sm bg-background/15"
          style={{ height: isMobile ? MOBILE_HEADER_HEIGHT : BROWSER_HEADER_HEIGHT }}
        >
          <Navbar
            data={[
              { label: "Gallery", to: "/gallery" },
              { label: "Map", to: "/map" },
              { label: "Hinter", to: "/hinter" },
            ]}
          />
        </header>
        <QueryClientProvider client={new QueryClient()}>
          <BrowserView className="galerie-main w-full max-w-full">
            {children}
            {modal}
          </BrowserView>
          <MobileView className="galerie-main w-full max-w-full">
            {children}
            {modal}
          </MobileView>
        </QueryClientProvider>
      </body>
    </html>
  );
}
