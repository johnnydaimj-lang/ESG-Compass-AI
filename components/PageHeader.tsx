interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-soft">{description}</p>}
    </header>
  );
}
