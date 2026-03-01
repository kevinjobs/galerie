"use client";

export default function HinterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="hinter">
      {children}
    </div>
  );
}
