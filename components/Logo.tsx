/* eslint-disable @next/next/no-img-element */
/** The aaroh wordmark. `tagline` adds "Your Love Story, Your Way" underneath. */
export default function Logo({ tagline = true, width = 140, className = "" }: { tagline?: boolean; width?: number; className?: string }) {
  const src = tagline ? "/brand/aaroh-logo.png" : "/brand/aaroh-wordmark.png";
  const ratio = tagline ? 387 / 720 : 249 / 600;
  return <img src={src} alt="aaroh" width={width} height={Math.round(width * ratio)} className={className} style={{ width, height: "auto" }} />;
}
