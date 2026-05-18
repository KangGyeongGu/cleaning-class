import { getActiveFaqs } from "@/shared/lib/queries/faq";
import { generateFaqPageJsonLd } from "@/shared/lib/json-ld";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLdScript } from "@/components/JsonLdScript";

export async function FaqSection() {
  const faqs = await getActiveFaqs();

  const faqPageJsonLd = generateFaqPageJsonLd(
    faqs.map((faq) => ({ question: faq.question, answer: faq.answer })),
  );

  return (
    <>
      <JsonLdScript data={faqPageJsonLd} />

      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-heading-1 mb-8">
          자주 묻는 질문
        </h2>
        <FaqAccordion faqs={faqs} />
      </section>
    </>
  );
}
