import { FileText } from "lucide-react";

/**
 * An email shown the way the customer sees it in their phone's Mail app:
 * a person writing to a person, not a system notification.
 */
export function MailFrame({
  from,
  fromEmail,
  to,
  when,
  subject,
  children,
  pdfs = [],
  image,
}: {
  from: string;
  fromEmail: string;
  to: string;
  when: string;
  subject: string;
  children: React.ReactNode;
  pdfs?: { name: string; size: string }[];
  image?: { src: string; name: string };
}) {
  return (
    <div className="mx-auto max-w-2xl bg-white text-[#1c1c1e] sm:my-6 sm:rounded-2xl sm:border sm:border-[#e5e5ea] sm:shadow-sm">
      <div className="border-b border-[#e5e5ea] px-4 pb-3 pt-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#c9a227] text-base font-semibold text-white">{from[0]}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate font-semibold">{from}</span>
              <span className="shrink-0 text-xs text-[#8e8e93]">{when}</span>
            </div>
            <div className="truncate text-xs text-[#8e8e93]">{fromEmail}</div>
            <div className="truncate text-xs text-[#8e8e93]">To: {to}</div>
          </div>
        </div>
        <div className="mt-3 text-[17px] font-semibold leading-snug">{subject}</div>
      </div>

      <div className="px-4 py-4 text-[15px] leading-relaxed [&_p]:mb-3">{children}</div>

      {(pdfs.length > 0 || image) && (
        <div className="space-y-2 px-4 pb-6">
          {pdfs.map((f) => (
            <div key={f.name} className="flex items-center gap-3 rounded-xl bg-[#f2f2f7] px-3 py-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-white"><FileText className="size-5 text-[#ff3b30]" /></span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{f.name}</div>
                <div className="text-xs text-[#8e8e93]">{f.size}</div>
              </div>
            </div>
          ))}
          {image && (
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.src} alt={image.name} className="w-full rounded-xl border border-[#e5e5ea]" />
              <figcaption className="mt-1 text-xs text-[#8e8e93]">{image.name}</figcaption>
            </figure>
          )}
        </div>
      )}
    </div>
  );
}

/** Laline's email signature — small, like a real person's. */
export function Signature({ name = "Laline", title = "Office Manager" }: { name?: string; title?: string }) {
  return (
    <div className="mt-5 border-t border-[#e5e5ea] pt-3 text-[13px] leading-snug text-[#3a3a3c]">
      <div className="font-semibold text-[#1c1c1e]">{name}</div>
      <div>{title} · MD Golden Builders</div>
      <div>(858) 332-2168 · info@mdgoldenbuilders.com</div>
      <div className="text-[#8e8e93]">CSLB #1128874 · 4275 Mission Bay Dr #359, San Diego, CA 92109</div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-light.png" alt="MD Golden Builders" className="mt-2 h-9 w-auto" />
    </div>
  );
}
