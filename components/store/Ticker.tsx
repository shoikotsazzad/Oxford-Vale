/** Slow-moving text strip under the hero. The second copy only completes the loop, so screen readers skip it. */
export function Ticker({ items }: { items: string[] }) {
  const row = (hidden?: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <li key={item} className="flex items-center font-serif text-xl whitespace-nowrap md:text-2xl">
          <span className="px-6 md:px-10">{item}</span>
          <span className="text-white/40" aria-hidden="true">✦</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="ticker overflow-hidden bg-night py-4 text-white md:py-5">
      <div className="ticker-track flex w-max">
        {row()}
        {row(true)}
      </div>
    </div>
  );
}
