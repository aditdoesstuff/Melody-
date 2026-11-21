"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/lib/store";
import type { Role, WeddingType } from "@/lib/types";
import Logo from "@/components/Logo";

const TYPES: { v: WeddingType; t: string; d: string }[] = [
  { v: "love", t: "Love Marriage", d: "The two of you, getting on the same page." },
  { v: "arranged", t: "Arranged Marriage", d: "Family is part of this. We keep their ideas visible, not in charge." },
  { v: "court", t: "Court Marriage", d: "Small and yours. We skip the family layer." },
];
const ROLES: { v: Role; t: string }[] = [{ v: "bride", t: "Bride" }, { v: "groom", t: "Groom" }, { v: "both", t: "Both" }, { v: "family", t: "Family member" }];
const STEPS = ["Wedding type", "Details", "Set up"];

export default function Welcome() {
  const router = useRouter();
  const hydrated = useApp((s) => s.hydrated);
  const saved = useApp((s) => s);
  const [step, setStep] = useState(0);
  const [type, setType] = useState<WeddingType>("love");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState<Role>("both");
  const [mode, setMode] = useState<"demo" | "empty">("demo");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { if (!useApp.persist.hasHydrated()) void useApp.persist.rehydrate(); }, []);
  // Pick up anything saved by "Save & Exit" once storage has loaded.
  useEffect(() => {
    if (!hydrated || loaded) return;
    /* eslint-disable react-hooks/set-state-in-effect -- one-time copy of persisted draft into the form */
    setType(saved.weddingType); setRole(saved.role); setDate(saved.date); setLocation(saved.location);
    setA(saved.names[0] === "You" ? "" : saved.names[0]); setB(saved.names[1] === "Partner" ? "" : saved.names[1]);
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [hydrated, loaded, saved]);

  const profile = () => ({ weddingType: type, role, names: [a.trim() || "You", b.trim() || "Partner"] as [string, string], date, location: location.trim() });
  const finish = () => { saved.finishOnboarding(profile(), mode, Date.now()); router.replace("/space"); };
  const saveExit = () => { if (!saved.onboarded) saved.patchProfile(profile()); router.push("/"); };

  return (
    <div className="min-h-dvh px-5 md:px-[72px] pt-6 md:pt-12 pb-16">
      <header className="flex items-start justify-between gap-4">
        <Link href="/" aria-label="aaroh home"><Logo width={140} /></Link>
        <button onClick={saveExit} className="mt-3 border-b border-wine-hi pb-0.5 hover:text-peach">Save &amp; Exit</button>
      </header>

      <ol className="mx-auto mt-8 md:mt-2 grid grid-cols-3 max-w-[600px] rounded-full bg-surface p-0 text-sm md:text-base" aria-label="Setup progress">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button onClick={() => i < step && setStep(i)} disabled={i > step} aria-current={i === step ? "step" : undefined}
              className={`w-full rounded-full py-2.5 transition-colors ${i === step ? "bg-[#a89f93] text-ink-black font-medium" : i < step ? "text-cream" : "text-muted"}`}>{label}</button>
          </li>
        ))}
      </ol>

      <main className="mx-auto max-w-[1140px] text-center mt-10 md:mt-12">
        {step === 0 && (
          <section aria-labelledby="q1">
            <h1 id="q1" className="h-serif text-4xl md:text-[4.2rem]">What is your type of wedding?</h1>
            <p className="lede text-lg md:text-[1.75rem] mt-4 md:mt-6">Tell us how your wedding journey begins, so we can personalise your experience.</p>
            <div role="radiogroup" aria-labelledby="q1" className="mx-auto max-w-[735px] mt-10 md:mt-16 space-y-6">
              {TYPES.map((t) => (
                <button key={t.v} role="radio" aria-checked={type === t.v} onClick={() => setType(t.v)} onDoubleClick={() => setStep(1)}
                  className={`w-full min-h-[72px] rounded-full border px-8 md:px-20 flex items-center justify-between gap-4 text-left transition-colors ${type === t.v ? "bg-cream border-cream text-ink-black" : "bg-surface border-tan hover:border-cream"}`}>
                  <span><span className="block text-xl md:text-[1.9rem] leading-tight">{t.t}</span><span className={`block text-xs md:text-sm mt-0.5 ${type === t.v ? "text-ink-black/70" : "text-muted"}`}>{t.d}</span></span>
                  <ArrowRight size={28} aria-hidden />
                </button>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="btn btn-primary mt-12 md:mt-16 min-h-[72px] w-full max-w-[397px] text-2xl md:text-[1.9rem] font-semibold justify-between px-16">Continue<ArrowRight size={28} aria-hidden /></button>
          </section>
        )}

        {step === 1 && (
          <section aria-labelledby="q2">
            <h1 id="q2" className="h-serif text-4xl md:text-[4.2rem]">Tell us a little bit about you two</h1>
            <p className="lede text-lg md:text-[1.75rem] mt-3">so we can personalise your wedding journey</p>
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="text-left mt-10 md:mt-14 space-y-8">
              <div className="grid md:grid-cols-2 gap-x-9 gap-y-8">
                <Field label="Your name"><input className="field !min-h-[72px] !px-12 !text-2xl" value={a} onChange={(e) => setA(e.target.value)} placeholder="Anya" autoComplete="given-name" /></Field>
                <Field label="Partner's name"><input className="field !min-h-[72px] !px-12 !text-2xl" value={b} onChange={(e) => setB(e.target.value)} placeholder="Anuj" /></Field>
                <Field label="Wedding date"><input type="date" className="field !min-h-[72px] !px-12 !text-2xl" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
                <Field label="Wedding location"><input className="field !min-h-[72px] !px-12 !text-2xl" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Delhi" /></Field>
              </div>
              <fieldset>
                <legend className="eyebrow !text-base !text-ink mb-3">Your role</legend>
                <div className="grid grid-cols-2 md:grid-cols-[1fr_1fr_1fr_1.9fr] gap-4 md:gap-6">
                  {ROLES.map((r) => (
                    <button type="button" key={r.v} aria-pressed={role === r.v} onClick={() => setRole(r.v)}
                      className={`min-h-[72px] rounded-full border text-xl md:text-[1.75rem] transition-colors ${role === r.v ? "bg-cream border-cream text-ink-black font-semibold" : "bg-surface border-tan hover:border-cream"}`}>{r.t}</button>
                  ))}
                </div>
              </fieldset>
              <p className="text-sm text-muted text-center">All of this is optional. Skip anything you have not decided.</p>
              <div className="text-center"><button type="submit" className="btn btn-primary min-h-[72px] w-full max-w-[397px] text-2xl md:text-[1.9rem] font-semibold justify-between px-16">Continue<ArrowRight size={28} aria-hidden /></button></div>
            </form>
          </section>
        )}

        {step === 2 && (
          <section aria-labelledby="q3">
            <h1 id="q3" className="h-serif text-4xl md:text-[4.2rem]">How do you want to begin?</h1>
            <p className="lede text-lg md:text-[1.75rem] mt-4">Your space is ready either way. You can switch later in Settings.</p>
            <div role="radiogroup" aria-labelledby="q3" className="grid md:grid-cols-2 gap-6 mt-10 md:mt-14 text-left">
              {([["demo", "Explore with a demo couple", "Sixty saved ideas from two partners and their family, already tagged. The fastest way to see every feature."], ["empty", "Start with an empty space", "Three sample cards show you how it works. Drop a screenshot, paste a link, or type a thought."]] as const).map(([v, t, d]) => (
                <button key={v} role="radio" aria-checked={mode === v} onClick={() => setMode(v)}
                  className={`rounded-[32px] border p-8 transition-colors ${mode === v ? "bg-cream border-cream text-ink-black" : "bg-surface border-tan hover:border-cream"}`}>
                  <span className="block text-2xl md:text-3xl font-medium">{t}</span>
                  <span className={`block mt-3 leading-relaxed ${mode === v ? "text-ink-black/75" : "text-muted"}`}>{d}</span>
                </button>
              ))}
            </div>
            <button onClick={finish} className="btn btn-primary mt-12 min-h-[72px] w-full max-w-[397px] text-2xl md:text-[1.9rem] font-semibold justify-between px-16">Enter<ArrowRight size={28} aria-hidden /></button>
            <p className="text-sm text-muted mt-5">No account. Everything stays on this device.</p>
          </section>
        )}
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="eyebrow !text-base !text-ink block mb-3 pl-2">{label}</span>{children}</label>;
}
