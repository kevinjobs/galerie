"use client";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="register-page h-full flex justify-center items-center">
      <div>{children}</div>
    </div>
  );
}
