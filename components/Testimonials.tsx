"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GalleryItem } from "@/lib/gallery-types";
import { formatTestimonialDateTime } from "@/lib/testimonial-date";

export function Testimonials({ testimonials }: { testimonials: GalleryItem[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const updateEdges = useCallback(() => {
    const element = track.current;
    if (!element) return;
    setEdges({
      start: element.scrollLeft <= 2,
      end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [updateEdges]);

  function scrollByCard(direction: 1 | -1) {
    const element = track.current;
    const card = element?.querySelector<HTMLElement>(".testimonial-card");
    if (!element || !card) return;
    const gap = parseFloat(getComputedStyle(element).columnGap) || 0;
    element.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: "smooth" });
  }

  return (
    <div className="testimonial-slider">
      <button className="testimonial-arrow testimonial-arrow-prev" type="button" aria-label="Previous testimonials" disabled={edges.start} onClick={() => scrollByCard(-1)} />
      <div className="testimonial-track" ref={track} onScroll={updateEdges} role="region" aria-label="Client testimonials" tabIndex={0}>
        {testimonials.map((testimonial) => {
          const when = formatTestimonialDateTime(testimonial.givenAt);
          return (
            <figure className="testimonial-card" key={testimonial.id}>
              <span className="testimonial-mark" aria-hidden="true">&rdquo;</span>
              <h3 className="testimonial-heading">{testimonial.title}</h3>
              <blockquote className="testimonial-quote">&ldquo;{testimonial.description}&rdquo;</blockquote>
              <figcaption className="testimonial-footer">
                <Image className="testimonial-avatar" src={testimonial.imageUrl ?? testimonial.filename} alt="" width={100} height={100} unoptimized />
                <div className="testimonial-person">
                  <div className="testimonial-name">{testimonial.authorName}</div>
                  {testimonial.designation && <div className="testimonial-role">{testimonial.designation}</div>}
                </div>
                {when && (
                  <time className="testimonial-when" dateTime={testimonial.givenAt}>
                    <span>{when.date}</span>
                    <small>{when.time}</small>
                  </time>
                )}
              </figcaption>
            </figure>
          );
        })}
      </div>
      <button className="testimonial-arrow testimonial-arrow-next" type="button" aria-label="Next testimonials" disabled={edges.end} onClick={() => scrollByCard(1)} />
    </div>
  );
}
