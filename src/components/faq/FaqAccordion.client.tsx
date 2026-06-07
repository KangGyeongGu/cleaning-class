"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FaqRow } from "@/shared/types/database";
import { track, currentPath } from "@/shared/lib/infra/track";

interface FaqAccordionProps {
  faqs: FaqRow[];
}

export function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openIds, setOpenIds] = useState(() => new Set<string>());

  if (faqs.length === 0) {
    return (
      <p className="py-12 text-center text-sm font-light text-slate-400">
        등록된 FAQ가 없습니다.
      </p>
    );
  }

  function toggle(id: string, faq: FaqRow): void {
    if (!openIds.has(id)) {
      track({
        event_type: "faq_open",
        event_payload: { faq_id: String(faq.id) },
        path: currentPath(),
      });
    }
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <ul className="divide-y divide-slate-100">
      {faqs.map((faq) => {
        const isOpen = openIds.has(faq.id);
        const questionId = `faq-question-${faq.id}`;
        const answerId = `faq-answer-${faq.id}`;

        return (
          <li key={faq.id}>
            <h3>
              <button
                type="button"
                id={questionId}
                aria-expanded={isOpen}
                aria-controls={answerId}
                onClick={() => toggle(faq.id, faq)}
                className="flex w-full items-start justify-between gap-4 py-5 text-left text-sm font-medium text-slate-900 transition-colors hover:text-slate-600"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  size={16}
                  aria-hidden="true"
                  className={`mt-0.5 shrink-0 text-slate-400 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : "rotate-0"
                  }`}
                />
              </button>
            </h3>

            <div
              id={answerId}
              role="region"
              aria-labelledby={`faq-question-${faq.id}`}
              className={`grid transition-all duration-200 ease-out ${
                isOpen ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"
              }`}
            >
              <p className="overflow-hidden text-sm leading-relaxed font-light text-slate-600">
                {faq.answer}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
