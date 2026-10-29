// Long-form copy for static pages (UK English). Business facts come from notes/client.md and the brief only.
// Contact details, delivery fees and the free-delivery amount are filled in live from admin settings.
// Policy pages are drafts written from the brand's stated terms: confirm with the business before launch (notes/missing.md).

export type Section = { heading: string; body: string[] };

export const about = {
  title: "About Oxford Vale",
  description: "Oxford Vale is an English heritage menswear brand from Savile Row, London: tailored suits, tweed, overcoats and leather shoes for a modern generation.",
  intro: "English heritage for a modern generation.",
  sections: [
    {
      heading: "Our idea",
      body: [
        "Oxford Vale started from a simple idea: the classic English wardrobe should be easy to wear today. Tweed caps, herringbone overcoats, sharp three-piece suits and well-made leather shoes have outlasted every trend, and they still look right.",
        "We take those classics and cut them for modern life: lighter cottons and linens for summer, wool and tweed for the colder months, and fits that work in the office and outside it.",
      ],
    },
    {
      heading: "What we make",
      body: [
        "Our range covers suits and blazers, overcoats and outerwear, waistcoats, shirts, trousers, knitwear, ties, caps, shoes and the small accessories that finish an outfit. Every piece is listed with its fabric and care notes, so you know exactly what you are buying.",
      ],
    },
    {
      heading: "How we sell",
      body: [
        "Shop online and pay by card, Apple Pay, Google Pay, PayPal or Klarna. We deliver across the UK, Europe and worldwide, and UK returns are free within 30 days.",
        "Prefer to see it in person? Visit our showroom at 14 Savile Row, Mayfair.",
      ],
    },
  ] satisfies Section[],
};

export const contact = {
  title: "Contact Us",
  description: "Call, email or message Oxford Vale. Showroom at 14 Savile Row, London. We reply within one working day.",
  intro: "Questions about sizing, an order or a delivery? Send us a message, call or email. We reply within one working day.",
};

/** General guide (standard UK/EU sizing). Replace with the brand's own measurements when available (notes/missing.md). */
export const sizeGuide = {
  title: "Size Guide",
  description: "How to measure and find your size for Oxford Vale suits, shirts, trousers, shoes and caps.",
  intro: "Measurements are body measurements in inches unless stated. If you are between sizes, choose the larger size for tailoring and outerwear. Not sure? Call or email our Savile Row team with your measurements and we'll help.",
  howTo: [
    { label: "Chest", text: "Measure around the fullest part of your chest, under the arms, keeping the tape level." },
    { label: "Waist", text: "Measure around your natural waistline, where you normally wear your trousers." },
    { label: "Neck", text: "Measure around the base of your neck, leaving one finger of space under the tape." },
    { label: "Head", text: "Measure around your head just above the ears and eyebrows, where a cap sits." },
    { label: "Foot", text: "Stand on paper, mark heel and longest toe, and measure the distance in centimetres." },
  ],
  tables: [
    {
      title: "Suits, blazers, waistcoats and outerwear (chest sizes)",
      head: ["Size", "Chest (in)", "Fits waist (in)"],
      rows: [["36", "35–36", "30"], ["38", "37–38", "32"], ["40", "39–40", "34"], ["42", "41–42", "36"], ["44", "43–44", "38"], ["46", "45–46", "40"]],
    },
    {
      title: "Shirts, knitwear and casual jackets",
      head: ["Size", "Chest (in)", "Neck (in)"],
      rows: [["S", "36–38", "14.5–15"], ["M", "38–40", "15–15.5"], ["L", "40–42", "16–16.5"], ["XL", "42–44", "17–17.5"], ["XXL", "44–46", "18–18.5"]],
    },
    {
      title: "Trousers (waist sizes)",
      head: ["Size", "Waist (in)", "Waist (cm)"],
      rows: [["28", "28", "71"], ["30", "30", "76"], ["32", "32", "81"], ["34", "34", "86"], ["36", "36", "91"], ["38", "38", "97"], ["40", "40", "102"]],
    },
    {
      title: "Shoes",
      head: ["EU", "UK", "Foot length (cm)"],
      rows: [["40", "6.5", "25.5"], ["41", "7", "26"], ["42", "8", "26.5"], ["43", "9", "27.5"], ["44", "9.5", "28"], ["45", "10.5", "29"]],
    },
    {
      title: "Caps and hats",
      head: ["Size", "Head (cm)", "Head (in)"],
      rows: [["M", "57–58", "22.4–22.8"], ["L", "59–60", "23.2–23.6"]],
    },
  ],
};

export const shippingPolicy = {
  title: "Delivery & Shipping",
  description: "Delivery options, fees and times for Oxford Vale orders in the UK, Europe and worldwide.",
  sections: [
    {
      heading: "Where we deliver",
      body: ["We deliver across the United Kingdom, to Europe and to most countries worldwide. Orders are dispatched from 14 Savile Row, London W1S 3PR."],
    },
    {
      heading: "Processing time",
      body: [
        "Orders are processed Monday to Friday, except UK bank holidays. Next-day orders placed before 2 pm on a working day are dispatched the same day.",
        "Every order is paid online at checkout; we start preparing it as soon as the payment is confirmed.",
      ],
    },
    {
      heading: "International orders",
      body: [
        "Delivery rates for Europe and the rest of the world are shown at checkout. Orders delivered outside the UK may be charged import duties and local taxes by the destination country; these are paid by the recipient.",
      ],
    },
    {
      heading: "Tracking your order",
      body: ["You will receive an order confirmation by email, and another email with the courier and tracking number when your order ships. You can check the status any time on the Track Order page with your order number and email or phone number."],
    },
  ] satisfies Section[],
};

export const returnsPolicy = {
  title: "Returns & Exchanges",
  description: "Free UK returns within 30 days of delivery.",
  sections: [
    {
      heading: "30-day returns",
      body: [
        "You can return or exchange an item within 30 days of delivery if it is unworn, unwashed, with all tags attached and in its original packaging. Returns are free for UK orders.",
        "This is in addition to your statutory rights: under the Consumer Contracts Regulations you can cancel an online order within 14 days of delivery.",
      ],
    },
    {
      heading: "How to start a return",
      body: [
        "Email support@oxfordvale.example or use the contact form with your order number and the items you want to return or exchange. We will send you a free UK returns label, or you can return items to our Savile Row showroom.",
        "International customers can return items at their own cost; please contact us first so we can recognise your parcel.",
      ],
    },
    {
      heading: "Refunds",
      body: [
        "Once we receive and check the items, we refund the item price to your original payment method (card, PayPal or Klarna) within 14 days. If you return a whole order, we also refund the standard delivery charge.",
      ],
    },
    {
      heading: "Items we can't take back",
      body: ["Worn, washed or altered items, and items without tags, cannot be returned unless they are faulty. Sale items can be returned within the same 30 days."],
    },
    {
      heading: "Faulty or wrong items",
      body: ["If your item arrives damaged, faulty or is not what you ordered, contact us with a photo and we will replace it or refund you in full, including delivery. Your rights under the Consumer Rights Act 2015 are not affected."],
    },
  ] satisfies Section[],
};

export const privacy = {
  title: "Privacy Policy",
  description: "How Oxford Vale collects, uses and protects your personal information.",
  sections: [
    {
      heading: "Who we are",
      body: ["Oxford Vale Menswear Ltd., 14 Savile Row, London W1S 3PR, is the data controller for information collected on this website. Contact us at support@oxfordvale.example with any privacy question."],
    },
    {
      heading: "What we collect",
      body: [
        "When you add items to your bag, check out, create an account or contact us, we collect your name, phone number, email address and delivery address, and the products in your bag and orders.",
        "We also store technical information needed to run the shop, such as a bag cookie, a login session cookie and your light or dark theme choice.",
      ],
    },
    {
      heading: "How we use it",
      body: [
        "We use your information to process and deliver orders, send order confirmations and delivery updates by email, respond to your messages, and follow up on bags you have not completed. Our lawful bases under UK GDPR are performing our contract with you and our legitimate interest in running the shop.",
        "We do not sell your information. We share only what is needed with delivery partners and payment providers (Stripe and PayPal) to complete your order.",
      ],
    },
    {
      heading: "Payments",
      body: ["Card, Apple Pay, Google Pay and Klarna payments are handled by Stripe, and PayPal payments by PayPal, on their secure pages. We never see or store your card details."],
    },
    {
      heading: "Cookies",
      body: ["We use only essential cookies for your bag and login, plus a small setting in your browser that remembers light or dark mode. The shop does not work without the essential cookies."],
    },
    {
      heading: "Your rights",
      body: ["You can view and update your details in your account, or ask us to access, correct or delete your information. If you are unhappy with how we handle your data, you can complain to the Information Commissioner's Office (ico.org.uk)."],
    },
  ] satisfies Section[],
};

export const terms = {
  title: "Terms & Conditions",
  description: "Terms for shopping at Oxford Vale.",
  sections: [
    {
      heading: "About these terms",
      body: ["These terms apply to orders placed on this website with Oxford Vale Menswear Ltd., registered in England and Wales. By placing an order you agree to them."],
    },
    {
      heading: "Prices and availability",
      body: [
        "Prices are shown in US dollars (USD) and include VAT where it applies. Delivery charges are shown at checkout before you pay.",
        "Stock is reserved when you place an order. If an item becomes unavailable we will contact you and refund any payment for it.",
      ],
    },
    {
      heading: "Orders and payment",
      body: [
        "Payment is taken at checkout by Stripe or PayPal. Your order is confirmed when the payment is confirmed and you receive a confirmation email. We may cancel orders with incorrect pricing or suspected fraud, and will refund any payment in full.",
        "You can cancel an unpaid order yourself while it is still Pending. After that, contact us and we will help if it has not been dispatched.",
      ],
    },
    {
      heading: "Coupons",
      body: ["Coupon codes have their own minimum order value, expiry date and usage limits, shown when you apply them. One coupon per order."],
    },
    {
      heading: "Returns",
      body: ["Returns and exchanges follow our Returns & Exchanges policy. Your statutory rights are not affected."],
    },
    {
      heading: "Law",
      body: ["These terms are governed by the law of England and Wales. For any questions, contact us using the details on the Contact page."],
    },
  ] satisfies Section[],
};
