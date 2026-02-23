"use client";

export default function HinterPhotoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="">
      <main>{children}</main>
    </div>
  );
}
