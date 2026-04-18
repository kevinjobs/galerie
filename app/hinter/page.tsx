"use client";

import Link from "next/link";

export default function HinterPage() {
  return (
    <div className="hinter-page-main text-center">
      <div><Link href="/hinter/photo">Photo</Link></div>
      <div><Link href="/hinter/user">User</Link></div>
      <div><Link href="/hinter/setting">Setting</Link></div>
    </div>
  );
}
