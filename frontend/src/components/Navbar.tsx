"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/history", label: "History" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: "rgba(10, 14, 19, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3" style={{ textDecoration: "none" }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "var(--teal)",
              borderRadius: 8,
              flexShrink: 0,
            }}
          />
          <span
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
          >
            AI Text Detector
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-8">
          {links.map((l) => {
            const isActive = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium pb-1 transition-colors duration-200 relative"
                style={{
                  fontFamily: "var(--font-body)",
                  color: isActive ? "var(--teal)" : "var(--text-secondary)",
                  textDecoration: "none",
                }}
              >
                {l.label}
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: -2,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: "var(--teal)",
                      borderRadius: 1,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
