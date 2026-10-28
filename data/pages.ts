// Long-form copy for static pages. Business facts come from notes/client.md and notes/brief.md only.
// Contact details, delivery fees and the free-delivery amount are filled in live from admin settings.

export type Section = { heading: string; body: string[] };

export const about = {
  title: "About Oxford Vale",
  description: "Oxford Vale is an English heritage menswear brand in Dhaka, bringing tailored suits, tweed, overcoats and leather shoes to men across Bangladesh.",
  intro: "English heritage for a modern generation.",
  sections: [
    {
      heading: "Our idea",
      body: [
        "Oxford Vale started from a simple idea: the classic English wardrobe should be easy to wear in Bangladesh. Tweed caps, herringbone overcoats, sharp three-piece suits and well-made leather shoes have outlasted every trend, and they still look right today.",
        "We take those classics and adapt them for Dhaka life: lighter linens and cottons for the long summer, wool and tweed for winter evenings and weddings, and fits that work in the office and outside it.",
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
        "Shop online with cash on delivery, bKash, Nagad or card, and get delivery anywhere in Bangladesh. If something doesn't fit, you can exchange or return it within 14 days of delivery.",
        "Prefer to see it in person? Visit our showroom in Gulshan 1, Dhaka.",
      ],
    },
  ] satisfies Section[],
};

export const contact = {
  title: "Contact Us",
  description: "Call, WhatsApp or message Oxford Vale. Showroom in Gulshan 1, Dhaka. We reply within one working day.",
  intro: "Questions about sizing, an order or a delivery? Send us a message, call or WhatsApp. We reply within one working day.",
};

/** General guide (standard UK/EU sizing). Replace with the brand's own measurements when available (notes/missing.md). */
export const sizeGuide = {
  title: "Size Guide",
  description: "How to measure and find your size for Oxford Vale suits, shirts, trousers, shoes and caps.",
  intro: "Measurements are body measurements in inches unless stated. If you are between sizes, choose the larger size for tailoring and outerwear. Not sure? Message us on WhatsApp with your measurements and we will help.",
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
  title: "Shipping Policy",
  description: "Delivery fees, delivery times and free delivery for Oxford Vale orders across Bangladesh.",
  sections: [
    {
      heading: "Where we deliver",
      body: ["We deliver to every district in Bangladesh. Orders are dispatched from our Gulshan 1, Dhaka showroom."],
    },
    {
      heading: "Processing time",
      body: [
        "Orders placed before 5 PM are usually processed the same day. Orders placed later, or on Fridays and public holidays, are processed the next working day.",
        "Orders paid by bKash or Nagad are processed after we verify the payment.",
      ],
    },
    {
      heading: "Tracking your order",
      body: ["You will receive an order confirmation by email and SMS. You can check the status any time on the Track Order page with your order number and phone number."],
    },
    {
      heading: "Cash on delivery",
      body: ["Cash on delivery is available everywhere we deliver. Please have the exact amount ready and check the parcel in front of the delivery person."],
    },
  ] satisfies Section[],
};

export const returnsPolicy = {
  title: "Returns & Exchanges",
  description: "Exchange or return Oxford Vale items within 14 days of delivery.",
  sections: [
    {
      heading: "14-day returns",
      body: ["You can exchange or return an item within 14 days of delivery if it is unworn, unwashed, with all tags attached and in its original packaging."],
    },
    {
      heading: "How to start a return",
      body: [
        "Contact us by phone, WhatsApp or the contact form with your order number and the item you want to exchange or return. We will confirm the next steps and arrange collection or drop-off at the showroom.",
      ],
    },
    {
      heading: "Refunds",
      body: [
        "Once we receive and check the item, we refund the item price to your original payment method, or by bKash or Nagad for cash on delivery orders. Delivery charges are not refundable unless the item was faulty or we sent the wrong item.",
      ],
    },
    {
      heading: "Items we can't take back",
      body: ["For hygiene reasons, worn or altered items, and items without tags, cannot be returned. Sale items can be exchanged for a different size if stock allows."],
    },
    {
      heading: "Faulty or wrong items",
      body: ["If your item arrives damaged or is not what you ordered, contact us within 48 hours of delivery with a photo and we will replace it or refund you in full, including delivery."],
    },
  ] satisfies Section[],
};

export const privacy = {
  title: "Privacy Policy",
  description: "How Oxford Vale collects, uses and protects your personal information.",
  sections: [
    {
      heading: "What we collect",
      body: [
        "When you add items to your cart, check out, create an account or contact us, we collect your name, mobile number, email address and delivery address, and the products in your cart and orders.",
        "We also store technical information needed to run the shop, such as a cart cookie, a login session cookie and your language preference.",
      ],
    },
    {
      heading: "How we use it",
      body: [
        "We use your information to process and deliver orders, send order confirmations and delivery updates by email and SMS, respond to your messages, and follow up on carts you have not completed.",
        "We do not sell your information. We share only what is needed with delivery partners and payment providers (such as SSLCommerz, bKash or Nagad) to complete your order.",
      ],
    },
    {
      heading: "Payments",
      body: ["Card payments are handled by SSLCommerz on their secure page. We never see or store your card details."],
    },
    {
      heading: "Cookies",
      body: ["We use essential cookies for your cart, login and language choice. The shop does not work without them."],
    },
    {
      heading: "Your choices",
      body: ["You can view and update your details in your account, or contact us to correct or delete your information."],
    },
  ] satisfies Section[],
};

export const terms = {
  title: "Terms & Conditions",
  description: "Terms for shopping at Oxford Vale.",
  sections: [
    {
      heading: "About these terms",
      body: ["These terms apply to orders placed on this website. By placing an order you agree to them."],
    },
    {
      heading: "Prices and availability",
      body: [
        "All prices are in Bangladeshi Taka (৳) and include applicable VAT. Delivery charges are shown at checkout before you pay.",
        "Stock is reserved when you place an order. If an item becomes unavailable we will contact you and refund any payment for it.",
      ],
    },
    {
      heading: "Orders and payment",
      body: [
        "An order is confirmed when you receive an order number. We may cancel orders with incorrect pricing, suspected fraud or an unreachable phone number, and will refund any payment in full.",
        "You can cancel your order yourself while it is still Pending. After that, contact us and we will help if it has not been dispatched.",
      ],
    },
    {
      heading: "Coupons",
      body: ["Coupon codes have their own minimum order value, expiry date and usage limits, shown when you apply them. One coupon per order."],
    },
    {
      heading: "Returns",
      body: ["Returns and exchanges follow our Returns & Exchanges policy."],
    },
    {
      heading: "Contact",
      body: ["For any questions about these terms, contact us using the details on the Contact page."],
    },
  ] satisfies Section[],
};
