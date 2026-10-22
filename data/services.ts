// Main offerings. Rename to menu/rooms/products/etc. per industry skill.
// price: number in Taka, or null to hide.

export type Service = {
  slug: string;
  title: string;
  summary: string;
  price: number | null;
  image: string;
};

export const services: Service[] = [
  { slug: "service-one", title: "[PLACEHOLDER: Service 1]", summary: "[PLACEHOLDER: Short description]", price: null, image: "/images/placeholder.svg" },
  { slug: "service-two", title: "[PLACEHOLDER: Service 2]", summary: "[PLACEHOLDER: Short description]", price: null, image: "/images/placeholder.svg" },
  { slug: "service-three", title: "[PLACEHOLDER: Service 3]", summary: "[PLACEHOLDER: Short description]", price: null, image: "/images/placeholder.svg" },
];
