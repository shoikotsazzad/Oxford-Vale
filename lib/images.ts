export const PLACEHOLDER = "/products/placeholder.svg";

/** Product image URL or the neutral placeholder. */
export const imageSrc = (url?: string | null) => url || PLACEHOLDER;
export const isPlaceholder = (url?: string | null) => !url || url === PLACEHOLDER || url.endsWith(".svg");
