"use client";

import { Fragment, useState } from "react";
import { faqCategories } from "@/lib/faq-categories";
import type { Faq, FaqCategory } from "@/lib/gallery-types";

function paragraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

export function FaqTabs({ faqs }: { faqs: Faq[] }) {
  // Tabs with no questions are hidden.
  const tabs = faqCategories.filter((category) => faqs.some((faq) => faq.category === category.id));
  const [active, setActive] = useState<FaqCategory | undefined>(tabs[0]?.id);
  const questions = faqs.filter((faq) => faq.category === active);
  // One answer open at a time; the first one starts open.
  const [openId, setOpenId] = useState<string | null>(questions[0]?.id ?? null);

  function selectTab(category: FaqCategory) {
    setActive(category);
    setOpenId(faqs.find((faq) => faq.category === category)?.id ?? null);
  }

  if (tabs.length === 0) return <p className="text-secondary text-center">There are no questions yet.</p>;

  return (
    <div className="faq">
      {tabs.length > 1 && (
        <div className="faq-tabs" role="tablist" aria-label="Question topics">
          {tabs.map((tab, index) => (
            <Fragment key={tab.id}>
              {index > 0 && <span className="faq-tab-divider" aria-hidden="true" />}
              <button
                className="faq-tab"
                type="button"
                role="tab"
                id={`faq-tab-${tab.id}`}
                aria-selected={active === tab.id}
                aria-controls="faq-panel"
                onClick={() => selectTab(tab.id)}
              >
                {tab.label}
              </button>
            </Fragment>
          ))}
        </div>
      )}
      <div className="faq-list" id="faq-panel" role="tabpanel" aria-labelledby={`faq-tab-${active}`}>
        {questions.map((faq) => {
          const open = openId === faq.id;
          return (
            <div className={`faq-item${open ? " is-open" : ""}`} key={faq.id}>
              <h3 className="faq-question">
                <button
                  type="button"
                  id={`faq-question-${faq.id}`}
                  aria-expanded={open}
                  aria-controls={`faq-answer-${faq.id}`}
                  onClick={() => setOpenId(open ? null : faq.id)}
                >
                  <span>{faq.question}</span>
                  <span className="faq-icon" aria-hidden="true" />
                </button>
              </h3>
              <div className="faq-answer" id={`faq-answer-${faq.id}`} role="region" aria-labelledby={`faq-question-${faq.id}`} hidden={!open}>
                {paragraphs(faq.answer).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
