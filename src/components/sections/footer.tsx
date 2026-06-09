"use client";

import React from 'react';
import { Instagram, Send, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/language-context';

const INSTAGRAM_URL = "https://www.instagram.com/zinvest.app?igsh=MTE3cW1ndHI2cnFsbg==";
const TELEGRAM_URL = "https://t.me/zinvestapp";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)] px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-24">
      <motion.div
        className="mx-auto max-w-7xl"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Brand and Description Info */}
          <div className="lg:col-span-5">
            <Link href="/" className="mb-6 flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-[var(--text-primary)] font-display">
                Zinvest
              </span>
            </Link>
            <p className="max-w-sm text-[16px] leading-[1.6] text-[var(--text-tertiary)] font-sans">
              {t.footer.tagline}
            </p>
            {/* Social Media Link Icons */}
            <div className="mt-8 flex items-center gap-4">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-muted)] transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] hover:text-[var(--accent)]"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                title="Telegram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-muted)] transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] hover:text-[var(--accent)]"
              >
                <Send className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Sitemap Links */}
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8 lg:col-span-7 lg:ml-auto">
            {/* Product Column */}
            <div>
              <h4 className="mb-6 text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                {t.footer.product}
              </h4>
              <ul className="space-y-4">
                <li>
                  <Link href="/#how-it-works" className="flex min-h-10 items-center text-sm font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] active:text-[var(--text-primary)] sm:min-h-0">
                    {t.footer.features}
                  </Link>
                </li>
                <li>
                  <Link href="/payment" className="flex min-h-10 items-center text-sm font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] active:text-[var(--text-primary)] sm:min-h-0">
                    {t.footer.pricing}
                  </Link>
                </li>
                <li>
                  <Link href="/payment" className="flex min-h-10 items-center text-sm font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] active:text-[var(--text-primary)] sm:min-h-0">
                    {t.footer.payment}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h4 className="mb-6 text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                {t.footer.resources}
              </h4>
              <ul className="space-y-4">
                <li>
                  <a href="#" aria-disabled="true" onClick={(e) => e.preventDefault()} className="flex min-h-10 items-center gap-2 text-sm font-medium text-[var(--text-tertiary)] cursor-not-allowed sm:min-h-0">
                    {t.footer.blog}
                    <span className="rounded-full bg-[var(--accent-bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent)]">Soon</span>
                  </a>
                </li>
                <li>
                  <a href="#" aria-disabled="true" onClick={(e) => e.preventDefault()} className="flex min-h-10 items-center gap-2 text-sm font-medium text-[var(--text-tertiary)] cursor-not-allowed sm:min-h-0">
                    {t.footer.guides}
                    <span className="rounded-full bg-[var(--accent-bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent)]">Soon</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 className="mb-6 text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                {t.footer.company}
              </h4>
              <ul className="space-y-4">
                {[t.footer.about, t.footer.careers, t.footer.privacy, t.footer.terms].map((label) => (
                  <li key={label}>
                    <a href="#" aria-disabled="true" onClick={(e) => e.preventDefault()} className="flex min-h-10 items-center gap-2 text-sm font-medium text-[var(--text-tertiary)] cursor-not-allowed sm:min-h-0">
                      {label}
                      <span className="rounded-full bg-[var(--accent-bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent)]">Soon</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="mt-20 flex flex-col items-center justify-between border-t border-[var(--border)] pt-8 md:flex-row">
          <p className="text-sm text-[var(--text-muted)]">
            &copy; {new Date().getFullYear()} Zinvest. {t.footer.rights}
          </p>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;
