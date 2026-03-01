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
    <html lang="en" className="dark max-w-full" data-theme="dark">
      <body className="max-w-full">
        <Toast.Provider placement="top" />
        <header
          className="w-full flex items-center justify-around absolute top-0"
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
          <main className="absolute top-14 w-full max-w-full max-h-[calc(100vh-56px)] overflow-y-auto overflow-x-hidden pb-8">
            {children}
            {modal}
          </main>
        </QueryClientProvider>
      </body>
    </html>
  );
}
