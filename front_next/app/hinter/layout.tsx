"use client";

export default function HinterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="hinter h-[calc(100%-64px)]">
      <div className="hinter-main h-full">
        {children}
      </div>
    </div>
  );
}
