"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { track, currentPath } from "@/shared/lib/infra/track";
import { useInViewport } from "@/shared/lib/hooks/useInViewport";
import { ContactForm } from "@/components/form/ContactForm.client";
import { MOVING_INQUIRY_OPTIONS } from "@/shared/lib/pure/constants";

type InquiryType = "cleaning" | "moving";

const OTHER_INQUIRY_OPTION = "기타 문의";

interface ContactSectionProps {
  phone?: string;
  cleaningServiceOptions: readonly string[];
}

export function ContactSection({
  phone,
  cleaningServiceOptions,
}: ContactSectionProps): React.ReactElement {
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get("service");
  const initialServiceType = serviceParam ?? "";

  const [inquiryType, setInquiryType] = useState<InquiryType>("cleaning");
  const { ref: sectionRef, isVisible } = useInViewport();

  return (
    <section ref={sectionRef} id="contact" className="bg-white">
      <div className="container mx-auto max-w-lg px-4 md:px-8 lg:px-12">
        <div
          className={`mb-8 text-center transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <h2 className="text-heading-1 mb-3">CONTACT</h2>
          {phone && (
            <p className="mt-3 text-sm text-slate-600">
              유선상담{" "}
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center px-1 font-bold text-slate-900 hover:underline"
                onClick={() =>
                  track({
                    event_type: "phone_click",
                    event_payload: {
                      phone_type: "cleaning",
                      click_location: "contact_form",
                    },
                    path: currentPath(),
                  })
                }
              >
                {phone}
              </a>
            </p>
          )}
        </div>

        <div
          className={`space-y-6 transition-all delay-200 duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setInquiryType("cleaning")}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                inquiryType === "cleaning"
                  ? "border-b-2 border-slate-900 text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              청소의뢰
            </button>
            <button
              type="button"
              onClick={() => setInquiryType("moving")}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                inquiryType === "moving"
                  ? "border-b-2 border-slate-900 text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              이사의뢰
            </button>
          </div>

          {inquiryType === "cleaning" ? (
            <ContactForm
              inquiryType="cleaning"
              serviceOptions={[...cleaningServiceOptions, OTHER_INQUIRY_OPTION]}
              initialServiceType={initialServiceType}
            />
          ) : (
            <ContactForm
              inquiryType="moving"
              serviceOptions={MOVING_INQUIRY_OPTIONS}
            />
          )}
        </div>
      </div>
    </section>
  );
}
