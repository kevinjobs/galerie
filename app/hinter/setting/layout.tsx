"use client";

export default function Default({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="flex justify-center">{children}</div>;
}
