"use client";

import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="mb-4">
      <a
        className={`mr-4 ${pathname === "/" ? "text-white border-b" : ""}`}
        href="/"
      >
        😃 Home
      </a>
      {/* <a
        className={`mr-4 ${
          pathname === "/stream" ? "text-white border-b" : ""
        }`}
        href="/Admin"
      >
        🏴‍☠️ Admin
      </a> */}
    </nav>
  );
}
