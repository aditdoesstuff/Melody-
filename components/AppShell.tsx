"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/lib/store";
import FamilyToggle from "./FamilyToggle";

const NAV = [
  { href: "/", label: "Home", icon: "◐" },
  { href: "/library", label: "Library", icon: "▦" },
  { href: "/declutter", label: "Declutter", icon: "✕" },
  { href: "/diagnostic", label: "Merge", icon: "∞" },
  { href: "/priorities", label: "Priorities", icon: "≡" },
  { href: "/budget", label: "Budget", icon: "◔" },
  { href: "/guide", label: "Guide", icon: "❡" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { hydrated, onboarded, marriageType } = useApp();
  const onWelcome = path === "/welcome";

  useEffect(() => {
    if (!useApp.persist.hasHydrated()) useApp.persist.rehydrate();
  }, []);
  useEffect(() => {
    if (hydrated && !onboarded && !onWelcome) router.replace("/welcome");
  }, [hydrated, onboarded, onWelcome, router]);

  if (onWelcome) return <main className="min-h-dvh">{children}</main>;
  if (!hydrated || !onboarded) return <div className="min-h-dvh grid place-items-center text-muted">…</div>;

  const showFamily = marriageType !== "court";
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[220px_1fr]">
      <aside className="hidden md:flex flex-col gap-1 p-5 border-r border-line sticky top-0 h-dvh">
        <Link href="/" className="h-serif text-2xl mb-6">Vow<span className="text-accent">.</span></Link>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} aria-current={path === n.href ? "page" : undefined}
            className={`rounded-xl px-3 py-2.5 text-sm flex gap-3 items-center ${path === n.href ? "bg-accent-soft text-accent font-semibold" : "text-muted hover:text-ink"}`}>
            <span aria-hidden className="w-4 text-center">{n.icon}</span>{n.label}
          </Link>
        ))}
        <p className="mt-auto text-xs text-muted leading-relaxed">Private to you and your partner. No ads, no vendors, no feed.</p>
      </aside>
      <div className="min-w-0 pb-24 md:pb-0">
        <header className="flex items-center justify-between gap-3 px-4 md:px-8 py-3 sticky top-0 z-30 bg-bg/90 backdrop-blur border-b border-line">
          <Link href="/" className="h-serif text-xl md:hidden">Vow<span className="text-accent">.</span></Link>
          <span className="hidden md:block eyebrow">Your wedding identity</span>
          {showFamily && <FamilyToggle />}
        </header>
        <main className="px-4 md:px-8 py-6 max-w-5xl mx-auto">{children}</main>
      </div>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-line grid grid-cols-7 pb-[env(safe-area-inset-bottom)]">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} aria-current={path === n.href ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 py-2 text-[10px] ${path === n.href ? "text-accent font-semibold" : "text-muted"}`}>
            <span aria-hidden className="text-base leading-none">{n.icon}</span>{n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
