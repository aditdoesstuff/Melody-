"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import type { MarriageType } from "@/lib/types";

const TYPES: { v: MarriageType; t: string; d: string }[] = [
  { v: "love", t: "Love marriage", d: "The two of you need to be on the same page." },
  { v: "arranged", t: "Arranged marriage", d: "Family is part of the process — let's make it visible." },
  { v: "court", t: "Court marriage", d: "Small and yours. We'll skip the family layer." },
];

export default function Welcome() {
  const router = useRouter();
  const finish = useApp((s) => s.finishOnboarding);
  const [step, setStep] = useState(0);
  const [type, setType] = useState<MarriageType>("love");
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  const go = (demo: boolean) => {
    finish(type, [a.trim() || "You", b.trim() || "Partner"], demo);
    router.replace(demo ? "/" : "/library");
  };

  return (
    <div className="min-h-dvh grid place-items-center px-5 py-10">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-3">
          <p className="eyebrow">Vow · step {step + 1} of 2</p>
          <h1 className="h-serif text-4xl leading-[1.05]">Remember what you love.<br /><span className="text-accent">Drop the rest.</span></h1>
          <p className="text-muted">Other wedding apps give you more to choose from. We help you choose less — and keep it yours.</p>
        </div>

        {step === 0 && (
          <div className="space-y-3">
            {TYPES.map((t) => (
              <button key={t.v} onClick={() => { setType(t.v); setStep(1); }}
                className="card w-full text-left p-4 hover:border-accent transition">
                <p className="font-semibold">{t.t}</p><p className="text-sm text-muted">{t.d}</p>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm space-y-1"><span className="eyebrow">You</span>
                <input value={a} onChange={(e) => setA(e.target.value)} placeholder="Your name" className="w-full card px-3 py-3 bg-card" /></label>
              <label className="text-sm space-y-1"><span className="eyebrow">Partner</span>
                <input value={b} onChange={(e) => setB(e.target.value)} placeholder="Their name" className="w-full card px-3 py-3 bg-card" /></label>
            </div>
            <button className="btn btn-primary w-full" onClick={() => go(true)}>Explore with a sample couple</button>
            <button className="btn w-full" onClick={() => go(false)}>Start from scratch</button>
            <button className="text-sm text-muted underline" onClick={() => setStep(0)}>Back</button>
            <p className="text-xs text-muted">No account. Everything stays on this device.</p>
          </div>
        )}
      </div>
    </div>
  );
}
