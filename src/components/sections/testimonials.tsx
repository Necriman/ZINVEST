"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { staggerContainer, slideUpVariants, viewportOnce, useReducedMotion } from "@/lib/motion";

const TESTIMONIALS = [
  {
    name: "Durdona Abdusattorova",
    text: "Zinvest turned complicated finance ideas into something I could actually use at work. The AI tutor answers in seconds and keeps me on track.",
    initials: "DA",
  },
  {
    name: "Urunov Erkin",
    text: "Clean layout, no clutter. I finally understand cash flow vs profit — the lessons feel premium and focused.",
    initials: "UE",
  },
];

export default function Testimonials() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      className="relative overflow-hidden bg-[var(--bg-card)] px-4 py-16 sm:px-6 sm:py-24"
      aria-labelledby="testimonials-heading"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-1/4 top-0 h-[420px] w-[420px] rounded-full bg-purple-500/[0.07] blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 h-[380px] w-[380px] rounded-full bg-blue-500/[0.06] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={slideUpVariants(0, 0.45)}
          className="mb-14 text-center md:text-left"
        >
          <h2
            id="testimonials-heading"
            className="text-[clamp(1.25rem,2.5vw+0.75rem,2.25rem)] font-bold tracking-tight text-[var(--text-primary)] md:text-4xl"
          >
            Our Customers&apos; Feedback
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] text-[var(--text-secondary)] md:mx-0 sm:text-base">
            Learners who use Zinvest for structured practice and AI support.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-6 md:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={reducedMotion ? undefined : staggerContainer(0.15)}
        >
          {TESTIMONIALS.map((item) => (
            <motion.article
              key={item.name}
              variants={slideUpVariants(0, 0.45)}
              whileHover={reducedMotion ? undefined : { rotateY: 2, rotateX: -1, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
              className="group rounded-[22px] border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-[var(--shadow)] backdrop-blur-sm transition-[border-color,box-shadow] duration-200 ease-out hover:border-blue-500/35 hover:shadow-[var(--shadow-md)]"
            >
              <span
                aria-hidden
                className="mb-2 block text-4xl leading-none text-[var(--text-muted)] transition-colors duration-200 group-hover:text-[var(--accent)]"
              >
                &ldquo;
              </span>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/20 to-purple-500/15 text-sm font-semibold text-blue-100 transition-transform duration-300 group-hover:scale-[1.03]">
                  {item.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--text-primary)]">{item.name}</p>
                  <div className="mt-1 flex gap-0.5" aria-label="5 out of 5 stars">
                    {[0, 1, 2, 3, 4].map((s) => (
                      <Star
                        key={s}
                        className="h-4 w-4 fill-amber-400/90 text-amber-400"
                        strokeWidth={0}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">&ldquo;{item.text}&rdquo;</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
