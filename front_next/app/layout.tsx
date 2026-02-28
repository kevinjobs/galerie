"use client";
import { Toast } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "./components/navbar";
import "./globals.css";
import { isMobile } from "react-device-detect";

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full bg-background" data-theme="dark">
      <body className="h-full">
        <Toast.Provider placement="top" />
        <header
          className="w-full flex items-center justify-around"
          style={{ height: isMobile ? 56 : 64 }}
        >
          <Navbar
            data={[
              { label: "Gallery", to: "/gallery" },
              { label: "Photo", to: "/hinter/photo" },
              { label: "User", to: "/hinter/user" },
              { label: "Setting", to: "/hinter/setting" },
            ]}
          />
        </header>
        <QueryClientProvider client={new QueryClient()}>
          {children}
          {modal}
        </QueryClientProvider>
      </body>
    </html>
  );
}
