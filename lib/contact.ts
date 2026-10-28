/** "01700-000002" → "8801700000002" for wa.me and tel: links. */
export const intlDigits = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("88") ? d : `88${d}`;
};

export const telLink = (phone: string) => `tel:+${intlDigits(phone)}`;
export const whatsappLink = (phone: string, text?: string) =>
  `https://wa.me/${intlDigits(phone)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
