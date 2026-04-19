"use client";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="galerie-map-main w-full h-screen">
      {children}
    </div>
  );
}
