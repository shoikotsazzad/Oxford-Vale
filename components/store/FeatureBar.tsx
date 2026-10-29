import { fmt, type Dict } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { AwardIcon, BoxIcon, LockIcon, TruckIcon } from "@/components/ui/icons";
import { Container } from "@/components/Container";

const ICONS = [TruckIcon, BoxIcon, AwardIcon, LockIcon];

export function FeatureBar({ t, freeOver }: { t: Dict; freeOver: number }) {
  return (
    <section className="reveal py-6 md:py-8">
      <Container>
        <ul className="grid grid-cols-2 rounded-xl border border-line bg-surface/50 lg:grid-cols-4">
          {t.home.features.map((f, i) => {
            const Icon = ICONS[i];
            return (
              <li key={f.title} className={`flex items-center gap-4 px-5 py-5 md:px-8 md:py-6 ${i % 2 ? "border-l border-line" : ""} ${i > 1 ? "border-t border-line lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}>
                <Icon size={30} strokeWidth={1.2} className="shrink-0" />
                <div>
                  <p className="label">{f.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{fmt(f.text, { amount: formatMoney(freeOver) })}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
