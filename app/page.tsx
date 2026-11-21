"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/lib/store";
import Logo from "@/components/Logo";

const HOW = [
  ["Dump", "Screenshots, links, voice-note thoughts. Throw it all in. No folders."],
  ["Find your themes", "aaroh reads the pile and shows the three to five things you keep coming back to."],
  ["Decide what matters", "Rank it before you price it. Your budget follows your ranking, not the other way round."],
  ["Share one page", "An identity guide your family and vendors can read in twenty seconds."],
];

export default function Landing() {
  const hydrated = useApp((s) => s.hydrated);
  const onboarded = useApp((s) => s.onboarded);
  const [joined, setJoined] = useState<string | null>(null);
  useEffect(() => {
    if (!useApp.persist.hasHydrated()) void useApp.persist.rehydrate();
    const code = new URLSearchParams(window.location.search).get("join");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the URL after mount avoids a hydration mismatch
    if (code) setJoined(code.slice(0, 8).toUpperCase());
  }, []);
  const start = hydrated && onboarded ? "/space" : "/welcome";
  const cta = hydrated && onboarded ? "Open your space" : "Start your wedding journey";

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="flex items-center justify-between gap-4 px-5 md:px-[72px] pt-6 md:pt-12">
        <Logo width={140} />
        <nav className="flex items-center gap-2 md:gap-4" aria-label="Site">
          <a href="#about" className="hidden sm:inline px-3 py-2 hover:text-peach">About</a>
          <a href="#how" className="hidden sm:inline px-3 py-2 hover:text-peach">How it works</a>
          {hydrated && onboarded && <Link href="/space" className="btn">Open space</Link>}
          <Link href={start} className="btn btn-primary">{hydrated && onboarded ? "Continue" : "Get started"}</Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="text-center px-5 pt-16 md:pt-24 pb-20 max-w-5xl mx-auto">
          {joined && <p className="chip chip-orange mb-6">You were invited with code {joined}. Partner sync is a preview, so this starts a space on this device.</p>}
          <h1 className="h-display text-[3.4rem] sm:text-7xl md:text-[7.5rem]">Remember<br />what you love.<br />Drop the rest</h1>
          <p className="lede text-lg md:text-[1.7rem] md:leading-snug mt-10 md:mt-14">Other wedding apps give you more to choose from.<br className="hidden md:block" /> We help you choose less, and keep it yours.</p>
          <Link href={start} className="btn btn-primary mt-10 md:mt-12 w-full max-w-[735px] min-h-[64px] md:min-h-[72px] text-xl md:text-[1.9rem] font-medium justify-between px-8 md:px-[90px]">
            {cta}<ArrowRight size={30} aria-hidden />
          </Link>
          <p className="text-sm text-muted mt-4">No sign-up. Nothing leaves your device.</p>
        </section>

        <section id="about" className="px-5 md:px-[72px] py-16 max-w-5xl mx-auto scroll-mt-8">
          <p className="eyebrow mb-3">About</p>
          <h2 className="h-serif text-4xl md:text-5xl max-w-3xl">Planning a wedding should not cost you your taste.</h2>
          <p className="lede text-lg mt-5 max-w-3xl text-muted">Your ideas are scattered across Instagram saves, Pinterest boards, WhatsApp forwards and one very long Notes file. Somewhere in there is the wedding you two actually want. aaroh is where you put all of it, so the pattern can show itself.</p>
        </section>

        <section id="how" className="px-5 md:px-[72px] py-16 max-w-6xl mx-auto scroll-mt-8">
          <p className="eyebrow mb-3">How it works</p>
          <h2 className="h-serif text-4xl md:text-5xl">Declutter first. Then decide.</h2>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {HOW.map(([t, d], i) => (
              <li key={t} className="card card-tan p-6">
                <p className="h-serif text-5xl opacity-60">{i + 1}</p>
                <p className="text-lg font-medium mt-4">{t}</p>
                <p className="text-sm text-muted mt-2 leading-relaxed">{d}</p>
              </li>
            ))}
          </ol>
          <div className="text-center mt-12"><Link href={start} className="btn btn-cream min-h-[56px] px-10 text-lg">{cta}<ArrowRight size={20} aria-hidden /></Link></div>
        </section>
      </main>

      <footer className="px-5 md:px-[72px] py-8 border-t border-line flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <Logo tagline={false} width={72} />
        <p>A prototype. Your data lives in this browser only.</p>
      </footer>
    </div>
  );
}
