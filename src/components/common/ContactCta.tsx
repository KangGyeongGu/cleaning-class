import TrackedCtaLink, {
  type CtaButtonId,
} from "@/components/analytics/TrackedCtaLink.client";

interface ContactCtaProps {
  description: React.ReactNode;
  contentId: CtaButtonId;
}

export function ContactCta({
  description,
  contentId,
}: ContactCtaProps): React.ReactElement {
  return (
    <section
      aria-label="견적 문의 유도"
      className="border-t border-slate-100 bg-slate-50 px-6 py-12"
    >
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-label mb-2 text-slate-400">Contact</p>
        <h2 className="mb-4 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
          견적 문의
        </h2>
        <p className="mb-8 text-sm leading-relaxed text-slate-500">
          {description}
        </p>
        <TrackedCtaLink
          href="/contact"
          contentId={contentId}
          className="btn-primary inline-block px-8 py-3 text-sm"
        >
          견적 문의하기
        </TrackedCtaLink>
      </div>
    </section>
  );
}
