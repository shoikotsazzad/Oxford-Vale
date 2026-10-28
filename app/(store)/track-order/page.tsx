import { getT } from "@/server/i18n";
import { buildMetadata } from "@/lib/seo";
import { Container } from "@/components/Container";
import { TrackOrderForm } from "@/components/order/PayForms";

export const metadata = buildMetadata({ title: "Track your order", description: "Check the status of your Oxford Vale order with your order number and phone number.", path: "/track-order" });

export default async function TrackOrderPage() {
  const t = await getT();
  return (
    <Container className="max-w-md py-12 md:py-20">
      <h1 className="font-serif text-4xl md:text-5xl">{t.order.track}</h1>
      <p className="mt-3 text-muted">{t.order.trackText}</p>
      <div className="mt-8"><TrackOrderForm /></div>
    </Container>
  );
}
