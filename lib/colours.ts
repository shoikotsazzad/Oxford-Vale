// Swatch colours for the colour filter and selector. Unknown names fall back to a neutral grey.
const HEX: Record<string, string> = {
  navy: "#1F2A44", black: "#111111", brown: "#5C3B28", charcoal: "#36383B", olive: "#5B5B33", grey: "#8A8C8E",
  tan: "#B08458", burgundy: "#6D2033", white: "#FFFFFF", "grey check": "#8F9091", camel: "#C19A6B", cream: "#F2EAD8",
  beige: "#D9C9AE", stone: "#C8C0B2", gold: "#C9A44C", "light blue": "#A9C6E0", green: "#2F5D3A", ivory: "#F6F1E3",
  "midnight blue": "#1A2238", "black/white": "#111111", pink: "#E7B7C0", "blue stripe": "#5D7FA8", "navy check": "#26334F",
  mint: "#BFE3D0", "brown check": "#6E4D36", print: "#7A6A5A", "sky blue": "#8EC1E6", "dark brown": "#3F2A1E",
  "light grey": "#C4C6C8", multi: "#8A7F72", silver: "#C0C0C0", "antique brass": "#9C7C38",
};

export const colourHex = (name: string) => HEX[name.trim().toLowerCase()] ?? "#9A958C";

/** True for light swatches, so a check mark on top should be dark. */
export function isLight(hex: string) {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return false;
  const [r, g, b] = m.slice(1).map((h) => parseInt(h, 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}
