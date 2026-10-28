import Image from "next/image";
import { imageSrc, isPlaceholder } from "@/lib/images";

/** Small 4:5 product thumbnail. */
export function Thumb({ src, className = "h-20 w-16" }: { src?: string | null; className?: string }) {
  const url = imageSrc(src);
  return (
    <div className={`relative shrink-0 overflow-hidden rounded bg-sand ${className}`}>
      <Image src={url} alt="" fill sizes="80px" className="object-cover" unoptimized={isPlaceholder(url)} />
    </div>
  );
}
