export default function EmptyState({ title, body, children }: { title: string; body?: string; children?: React.ReactNode }) {
  return (
    <div className="card card-tan p-8 md:p-12 text-center max-w-2xl mx-auto">
      <p className="h-serif text-3xl">{title}</p>
      {body && <p className="lede text-muted mt-2">{body}</p>}
      {children && <div className="flex flex-wrap justify-center gap-3 mt-6">{children}</div>}
    </div>
  );
}
