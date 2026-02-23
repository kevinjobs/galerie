"use client";

export default function HinterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="hinter h-full">
      <div className="hinter-main h-full">
        {children}
      </div>
    </div>
  );
}
