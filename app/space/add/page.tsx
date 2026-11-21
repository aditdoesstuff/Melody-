"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import QuickAdd from "@/components/QuickAdd";

/** A focused add screen. Handy as a home-screen shortcut: open, drop, done. */
export default function QuickAddPage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/space" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-peach mb-4"><ArrowLeft size={15} aria-hidden />Back to your space</Link>
      <h1 className="h-serif text-5xl mb-2">Add something</h1>
      <p className="lede text-muted mb-6">A screenshot, a link, a colour, a thought. No titles, no folders.</p>
      <QuickAdd autoFocus onAdded={() => router.push("/space")} />
    </div>
  );
}
