export function EmptyState({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line px-6 py-16 text-center">
      <p className="font-serif text-2xl">{title}</p>
      {text && <p className="mt-2 text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
