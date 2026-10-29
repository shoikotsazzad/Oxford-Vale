// Labelled form controls with error messages wired up for screen readers.
type Base = { label: string; name: string; error?: string; hint?: string; className?: string };

const control = (error?: string) =>
  `mt-1.5 block min-h-12 w-full rounded-md border bg-surface px-3 text-base outline-none transition-colors focus:border-ink ${error ? "border-danger" : "border-line"}`;

function Wrap({ label, name, error, hint, className = "", children }: Base & { children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={`f-${name}`} className="text-sm">{label}</label>
      {children}
      {hint && !error && <p id={`f-${name}-hint`} className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p id={`f-${name}-err`} className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}

const describedBy = (name: string, error?: string, hint?: string) => (error ? `f-${name}-err` : hint ? `f-${name}-hint` : undefined);

export function TextField({ label, name, error, hint, className, ...rest }: Base & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">) {
  return (
    <Wrap label={label} name={name} error={error} hint={hint} className={className}>
      <input id={`f-${name}`} name={name} aria-invalid={Boolean(error)} aria-describedby={describedBy(name, error, hint)} className={control(error)} {...rest} />
    </Wrap>
  );
}

export function TextArea({ label, name, error, hint, className, ...rest }: Base & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name">) {
  return (
    <Wrap label={label} name={name} error={error} hint={hint} className={className}>
      <textarea id={`f-${name}`} name={name} aria-invalid={Boolean(error)} aria-describedby={describedBy(name, error, hint)} className={`${control(error)} py-3`} {...rest} />
    </Wrap>
  );
}

export function SelectField({ label, name, error, hint, className, children, ...rest }: Base & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name">) {
  return (
    <Wrap label={label} name={name} error={error} hint={hint} className={className}>
      <select id={`f-${name}`} name={name} aria-invalid={Boolean(error)} aria-describedby={describedBy(name, error, hint)} className={`${control(error)} pr-8`} {...rest}>
        {children}
      </select>
    </Wrap>
  );
}

export function Checkbox({ label, checked, onChange, name }: { label: string; checked: boolean; onChange: (v: boolean) => void; name: string }) {
  return (
    <label htmlFor={`f-${name}`} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
      <input id={`f-${name}`} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-ink" />
      {label}
    </label>
  );
}
