"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NetworkSwitcher } from "@/components/NetworkSwitcher";
import { WalletConnect } from "@/components/WalletConnect";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/home", label: "Home" },
  { href: "/claims", label: "Claims" },
  { href: "/create", label: "Create" },
];

export function Header() {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <header className="app-header">
      <div className="page-shell">
        <div className="flex min-h-[var(--header-h)] items-center justify-between gap-3 py-2.5">
          <div className="flex min-w-0 items-center gap-5">
            <Link
              href={isLanding ? "/" : "/home"}
              className="group flex items-center gap-2.5 shrink-0 min-h-11"
              aria-label={isLanding ? "GenResolve home" : "GenResolve dashboard"}
            >
              <span className="brand-mark transition-transform duration-200 group-hover:scale-[1.03]">
                GR
              </span>
              <span className="brand-word hidden sm:inline">
                Gen<span>Resolve</span>
              </span>
            </Link>

            {!isLanding && (
              <nav className="nav-pill" aria-label="Primary">
                {NAV.map((item) => {
                  const active =
                    item.href === "/home"
                      ? pathname === "/home"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="nav-link"
                      data-active={active ? "true" : "false"}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {isLanding ? (
              <>
                <Link
                  href="/home"
                  className="btn btn-ghost btn-sm min-h-11 hidden sm:inline-flex"
                >
                  Open app
                </Link>
                <Link href="/create" className="btn btn-primary btn-sm min-h-11">
                  Create claim
                </Link>
              </>
            ) : (
              <>
                <NetworkSwitcher />
                <WalletConnect />
              </>
            )}
          </div>
        </div>

        {!isLanding && (
          <nav className="mobile-nav pb-2.5" aria-label="Mobile">
            {NAV.map((item) => {
              const active =
                item.href === "/home"
                  ? pathname === "/home"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-3.5 py-2.5 min-h-11 text-sm font-medium shrink-0 border border-transparent inline-flex items-center",
                    active
                      ? "bg-[rgba(139,124,246,0.18)] text-[var(--violet-bright)] border-[rgba(139,124,246,0.3)] font-semibold"
                      : "text-[var(--text-muted)]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
