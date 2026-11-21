export default function PageHeader({ title, lede, children }: { title: string; lede?: string; children?: React.ReactNode }) {
  return (
    <header className="mb-6 md:mb-8">
      <h1 className="h-serif text-[2.6rem] md:text-6xl">{title}</h1>
      {lede && <p className="lede text-base md:text-xl mt-2 max-w-3xl">{lede}</p>}
      {children && <div className="flex flex-wrap gap-3 mt-5">{children}</div>}
    </header>
  );
}
