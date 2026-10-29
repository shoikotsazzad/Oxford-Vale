import "server-only";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { Order } from "@/models";
import type { StoreSettings } from "@/lib/types";
import { formatMoneyExact } from "@/lib/money";
import { addressLines, HOME_COUNTRY } from "@/lib/address";
import { formatPhone } from "@/lib/phone";

const tk = formatMoneyExact;
const VAT_RATE = 0.2; // UK standard rate; prices include VAT
const date = (d: Date) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Europe/London" }).format(d);
const METHOD: Record<string, string> = { stripe: "Card / wallet / Klarna (Stripe)", paypal: "PayPal" };

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9.5, fontFamily: "Helvetica", color: "#111111", lineHeight: 1.4 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  brand: { fontFamily: "Times-Bold", fontSize: 20, letterSpacing: 2, lineHeight: 1.2, marginBottom: 4 },
  muted: { color: "#6B655C" },
  h: { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#6B655C", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  table: { marginTop: 22, borderTopWidth: 1, borderColor: "#E2DDD3" },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#E2DDD3", paddingVertical: 6 },
  th: { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#6B655C", textTransform: "uppercase" },
  cItem: { flex: 1, paddingRight: 8 },
  cQty: { width: 36, textAlign: "right" },
  cPrice: { width: 72, textAlign: "right" },
  totals: { marginTop: 10, marginLeft: "auto", width: 220 },
  total: { fontFamily: "Helvetica-Bold", fontSize: 11, borderTopWidth: 1, borderColor: "#111111", paddingTop: 6, marginTop: 4 },
  footer: { position: "absolute", bottom: 32, left: 40, right: 40, fontSize: 8, color: "#6B655C", borderTopWidth: 1, borderColor: "#E2DDD3", paddingTop: 8 },
});

function InvoiceDoc({ o, st }: { o: Order; st: StoreSettings }) {
  const a = o.shippingAddress!;
  const paid = o.paymentStatus === "paid";
  return (
    <Document title={`Invoice ${o.orderNo}`} author={st.storeName}>
      <Page size="A4" style={s.page}>
        <View style={s.row}>
          <View>
            <Text style={s.brand}>{st.storeName.toUpperCase()}</Text>
            <Text style={s.muted}>{st.legal.name}</Text>
            <Text style={s.muted}>{[st.address.line, st.address.area, `${st.address.city} ${st.address.postalCode}`].filter(Boolean).join(", ")}</Text>
            <Text style={s.muted}>{st.contact.phone} · {st.contact.email}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 14, lineHeight: 1.2, marginBottom: 2 }}>INVOICE</Text>
            <Text>{o.orderNo}</Text>
            <Text style={s.muted}>{date(o.createdAt)}</Text>
            <Text style={{ marginTop: 6, fontFamily: "Helvetica-Bold", color: paid ? "#2F5D3A" : "#7A2E2A" }}>{paid ? "PAID" : o.paymentStatus === "refunded" ? "REFUNDED" : "PAYMENT DUE"}</Text>
          </View>
        </View>

        <View style={[s.row, { marginTop: 26 }]}>
          <View style={{ width: "48%" }}>
            <Text style={s.h}>Bill to</Text>
            <Text>{o.customer!.name}</Text>
            <Text>{formatPhone(o.customer!.phone)}</Text>
            {o.customer!.email ? <Text>{o.customer!.email}</Text> : null}
          </View>
          <View style={{ width: "48%" }}>
            <Text style={s.h}>Deliver to</Text>
            <Text>{a.name} · {formatPhone(a.phone)}</Text>
            {addressLines({ line1: a.line1, line2: a.line2 ?? "", city: a.city, county: a.county ?? "", postcode: a.postcode ?? "", country: a.country }).map((l) => <Text key={l}>{l}</Text>)}
          </View>
        </View>

        <View style={s.table}>
          <View style={s.tr}>
            <Text style={[s.th, s.cItem]}>Item</Text>
            <Text style={[s.th, s.cQty]}>Qty</Text>
            <Text style={[s.th, s.cPrice]}>Unit</Text>
            <Text style={[s.th, s.cPrice]}>Amount</Text>
          </View>
          {o.items.map((i) => (
            <View key={i.sku} style={s.tr} wrap={false}>
              <View style={s.cItem}>
                <Text>{i.name}</Text>
                <Text style={s.muted}>{[i.size !== "One Size" && i.size, i.colour, i.sku].filter(Boolean).join(" · ")}</Text>
              </View>
              <Text style={s.cQty}>{i.qty}</Text>
              <Text style={s.cPrice}>{tk(i.unitPrice)}</Text>
              <Text style={s.cPrice}>{tk(i.lineTotal)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totals}>
          <View style={s.row}><Text style={s.muted}>Subtotal</Text><Text>{tk(o.subtotal)}</Text></View>
          {o.discount > 0 ? <View style={s.row}><Text style={s.muted}>Discount{o.couponCode ? ` (${o.couponCode})` : ""}</Text><Text>-{tk(o.discount)}</Text></View> : null}
          <View style={s.row}><Text style={s.muted}>Delivery ({o.delivery?.name})</Text><Text>{o.delivery?.fee ? tk(o.delivery.fee) : "Free"}</Text></View>
          <View style={[s.row, s.total]}><Text>Total</Text><Text>{tk(o.total)}</Text></View>
          {a.country === HOME_COUNTRY ? <View style={s.row}><Text style={s.muted}>Includes VAT at {VAT_RATE * 100}%</Text><Text style={s.muted}>{tk(Math.round(o.total - o.total / (1 + VAT_RATE)))}</Text></View> : null}
          <Text style={[s.muted, { marginTop: 6, textAlign: "right" }]}>Payment: {METHOD[o.paymentMethod]}</Text>
        </View>

        <View style={s.footer} fixed>
          <Text>{st.invoiceFooter}</Text>
          <Text>
            {`${st.legal.name} is registered in England and Wales (company no. ${st.legal.companyNo}). Registered office: ${st.legal.registeredOffice}. VAT no. ${st.legal.vatNo}.`}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export const renderInvoice = (order: Order, settings: StoreSettings) => renderToBuffer(<InvoiceDoc o={order} st={settings} />);
