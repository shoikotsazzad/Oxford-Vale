// Privacy and Terms content. Generic placeholders — adapt to the client's actual practices.

type Section = { heading: string; body: string };

export const privacy: Section[] = [
  { heading: "Information we collect", body: "When you use our contact form we collect your name, phone number, email (optional) and message, only to reply to you." },
  { heading: "How we use it", body: "We use your information to respond to enquiries and provide our services. We do not sell or share it with third parties." },
  { heading: "Analytics", body: "[PLACEHOLDER: Mention Google Analytics / Meta Pixel if enabled, otherwise remove this section.]" },
  { heading: "Contact", body: "To ask about or remove your information, contact us using the details on our Contact page." },
];

export const terms: Section[] = [
  { heading: "Website use", body: "Content on this website is for general information and may change without notice." },
  { heading: "Prices and availability", body: "Prices and availability shown are subject to change. Please confirm with us before ordering or booking." },
  { heading: "Bookings, orders and refunds", body: "[PLACEHOLDER: Client's booking, advance payment, cancellation and refund terms.]" },
  { heading: "Contact", body: "For questions about these terms, contact us using the details on our Contact page." },
];
