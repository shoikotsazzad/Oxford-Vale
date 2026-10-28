import { WhatsAppIcon } from "@/components/ui/icons";
import { whatsappLink } from "@/lib/contact";

export function WhatsAppButton({ number, message }: { number: string; message: string }) {
  return (
    <a
      href={whatsappLink(number, message)}
      target="_blank"
      rel="noopener"
      aria-label="Chat on WhatsApp"
      className="fixed right-4 bottom-4 z-30 flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:-translate-y-0.5 md:right-6 md:bottom-6"
    >
      <WhatsAppIcon size={26} />
    </a>
  );
}
