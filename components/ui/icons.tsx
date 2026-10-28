// Line icons (24px grid, 1.5 stroke) so every icon in the store shares one weight.
type P = React.SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

export const SearchIcon = (p: P) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>;
export const UserIcon = (p: P) => <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>;
export const HeartIcon = (p: P) => <Svg {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></Svg>;
export const BagIcon = (p: P) => <Svg {...p}><path d="M5 8h14l-1 13H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></Svg>;
export const ArrowRightIcon = (p: P) => <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
export const MenuIcon = (p: P) => <Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>;
export const CloseIcon = (p: P) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
export const ChevronDownIcon = (p: P) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>;
export const ChevronLeftIcon = (p: P) => <Svg {...p}><path d="m15 6-6 6 6 6" /></Svg>;
export const ChevronRightIcon = (p: P) => <Svg {...p}><path d="m9 6 6 6-6 6" /></Svg>;
export const PlusIcon = (p: P) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const MinusIcon = (p: P) => <Svg {...p}><path d="M5 12h14" /></Svg>;
export const FilterIcon = (p: P) => <Svg {...p}><path d="M4 6h16M7 12h10M10 18h4" /></Svg>;
export const TruckIcon = (p: P) => <Svg {...p}><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7" cy="17.5" r="1.5" /><circle cx="17" cy="17.5" r="1.5" /></Svg>;
export const BoxIcon = (p: P) => <Svg {...p}><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z" /><path d="m3 7.5 9 4.5 9-4.5M12 12v9" /></Svg>;
export const AwardIcon = (p: P) => <Svg {...p}><circle cx="12" cy="9" r="6" /><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7" /></Svg>;
export const LockIcon = (p: P) => <Svg {...p}><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></Svg>;
export const PhoneIcon = (p: P) => <Svg {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></Svg>;
export const MailIcon = (p: P) => <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Svg>;
export const PinIcon = (p: P) => <Svg {...p}><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></Svg>;
export const CheckIcon = (p: P) => <Svg {...p}><path d="m5 12 5 5 9-10" /></Svg>;

export function WhatsAppIcon({ size = 20, ...rest }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2z" />
    </svg>
  );
}
