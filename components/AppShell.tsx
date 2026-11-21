"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight, Check, Fingerprint, LayoutGrid, ListOrdered, Send, Settings, Shapes, Wallet } from "lucide-react";
import { useApp, whoName } from "@/lib/store";
import { nextStep, steps } from "@/lib/progress";
import Logo from "./Logo";
import { Toaster } from "./Toast";

const NAV = [
  { href: "/space", label: "Space", icon: LayoutGrid },
  { href: "/diagnostic", label: "Themes", icon: Shapes },
  { href: "/priorities", label: "Priorities", icon: ListOrdered },
  { href: "/identity", label: "Identity", icon: Fingerprint },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/invites", label: "Invites", icon: Send },
  { href: "/settings", label: "Settings", icon: Settings },
];
const isBare = (p: string) => p === "/" || p === "/welcome" || p.startsWith("/share");
const active = (path: string, href: string) => path === href || path.startsWith(href + "/");

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const hydrated = useApp((s) => s.hydrated);
  const onboarded = useApp((s) => s.onboarded);
  const bare = isBare(path);

  useEffect(() => { if (!useApp.persist.hasHydrated()) void useApp.persist.rehydrate(); }, []);
  useEffect(() => { if (hydrated && !onboarded && !bare) router.replace("/"); }, [hydrated, onboarded, bare, router]);

  if (bare) return <>{children}<Toaster /></>;
  if (!hydrated || !onboarded) return <ShellSkeleton />;
  return <Shell path={path}>{children}</Shell>;
}

function ShellSkeleton() {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[230px_1fr]" aria-busy="true" aria-label="Loading your space">
      <aside className="hidden md:block bg-rail h-dvh p-8"><div className="skeleton h-16 w-32" /></aside>
      <div className="p-6 md:p-12 space-y-5"><div className="skeleton h-14 w-72" /><div className="skeleton h-6 w-96 max-w-full" /><div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6">{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <div key={i} className="skeleton h-40" />)}</div></div>
    </div>
  );
}

function Shell({ path, children }: { path: string; children: React.ReactNode }) {
  const s = useApp();
  const list = steps(s);
  const next = nextStep(list);
  const showFamily = s.weddingType !== "court";
  const tabs = NAV.slice(0, 5);

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[230px_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[90] btn btn-cream">Skip to content</a>

      {/* Desktop rail, as in the mockups */}
      <aside className="hidden md:flex flex-col bg-rail sticky top-0 h-dvh px-7 py-9 overflow-y-auto">
        <Link href="/space" aria-label="aaroh, go to your space" className="mb-12 block"><Logo width={132} /></Link>
        <nav aria-label="Main" className="flex flex-col gap-3">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(path, n.href) ? "page" : undefined}
              className={`rounded-full px-5 py-2.5 text-[15px] tracking-wide uppercase transition-colors ${active(path, n.href) ? "bg-wine text-white" : "text-ink hover:text-peach"}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <p className="mt-auto pt-8 text-xs text-muted leading-relaxed">Everything stays on this device. No ads, no vendors, no feed.</p>
      </aside>

      <div className="min-w-0 pb-28 md:pb-10">
        <header className="sticky top-0 z-30 bg-bg/85 backdrop-blur-md border-b border-line">
          <div className="flex items-center gap-3 px-4 md:px-10 h-14">
            <Link href="/space" className="md:hidden shrink-0" aria-label="aaroh, go to your space"><Logo tagline={false} width={64} /></Link>
            <ol className="hidden lg:flex items-center gap-1.5 text-xs min-w-0" aria-label="Your path">
              {list.map((st, i) => (
                <li key={st.key} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden className="w-4 h-px bg-tan" />}
                  <Link href={st.href} title={st.hint} aria-current={active(path, st.href) ? "step" : undefined}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 border ${st.done ? "border-green bg-green/40 text-green-text" : next?.key === st.key ? "border-cream text-cream" : "border-line text-muted"}`}>
                    {st.done && <Check size={12} aria-hidden />}{st.label}<span className="sr-only">{st.done ? " (done)" : ""}</span>
                  </Link>
                </li>
              ))}
            </ol>
            <div className="ml-auto flex items-center gap-2">
              {s.persona === "B" && <Link href="/settings" className="chip chip-orange" title="Partner view is a one-device preview. Switch back in Settings.">Viewing as {whoName(s.names, "B")}</Link>}
              {showFamily && (
                <div role="group" aria-label="Whose ideas to show" className="inline-flex rounded-full border border-tan p-0.5 text-xs">
                  {(["couple", "family"] as const).map((v) => (
                    <button key={v} onClick={() => s.setView(v)} aria-pressed={s.view === v} className={`rounded-full px-3 py-1.5 min-h-8 transition-colors ${s.view === v ? "bg-cream text-ink-black font-semibold" : "text-muted"}`}>{v === "couple" ? "Ours" : "+ Family"}</button>
                  ))}
                </div>
              )}
              {next && !active(path, next.href) && (
                <Link href={next.href} className="btn btn-primary btn-sm hidden sm:inline-flex" title={next.hint}>Next: {next.label}<ArrowRight size={14} aria-hidden /></Link>
              )}
              <Link href="/settings" aria-label="Settings" className="md:hidden btn btn-ghost btn-icon"><Settings size={20} /></Link>
            </div>
          </div>
        </header>
        <main id="main" className="px-4 md:px-10 py-7 md:py-10 max-w-[1280px]">{children}</main>
      </div>

      {/* Phone: invites as a floating action, the five steps as tabs */}
      {!active(path, "/invites") && (
        <Link href="/invites" aria-label="Invites" className="md:hidden fixed right-4 bottom-[88px] z-40 size-14 rounded-full bg-wine text-white grid place-items-center shadow-2xl border border-wine-hi"><Send size={22} aria-hidden /></Link>
      )}
      <nav aria-label="Main" className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-rail/95 backdrop-blur border-t border-line grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((n) => (
          <Link key={n.href} href={n.href} aria-current={active(path, n.href) ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-1 min-h-[60px] text-[10px] uppercase tracking-wider ${active(path, n.href) ? "text-peach" : "text-muted"}`}>
            <span className={`grid place-items-center rounded-full w-12 h-7 ${active(path, n.href) ? "bg-wine text-white" : ""}`}><n.icon size={18} aria-hidden /></span>{n.label}
          </Link>
        ))}
      </nav>
      <Toaster />
    </div>
  );
}
