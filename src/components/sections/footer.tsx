"use client";

import React from 'react';
import { Twitter, Linkedin, Github, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';

const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)] px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-24">
      <div className="mx-auto max-w-7xl">
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
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-muted)] transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] hover:text-[var(--accent)]"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-muted)] transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] hover:text-[var(--accent)]"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-muted)] transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] hover:text-[var(--accent)]"
              >
                <Github className="h-4 w-4" />
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
                  <Link href="/learn" className="flex min-h-10 items-center text-sm font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] active:text-[var(--text-primary)] sm:min-h-0">
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
                  <Link href="/learn" className="flex min-h-10 items-center text-sm font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] active:text-[var(--text-primary)] sm:min-h-0">
                    {t.footer.blog}
                  </Link>
                </li>
                <li>
                  <Link href="/learn" className="flex min-h-10 items-center text-sm font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] active:text-[var(--text-primary)] sm:min-h-0">
                    {t.footer.guides}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 className="mb-6 text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                {t.footer.company}
              </h4>
              <ul className="space-y-4">
                <li>
                  <Link href="/" className="flex min-h-10 items-center text-sm font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] active:text-[var(--text-primary)] sm:min-h-0">
                    {t.footer.about}
                  </Link>
                </li>
                <li>
                  <Link href="/" className="flex min-h-10 items-center text-sm font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] active:text-[var(--text-primary)] sm:min-h-0">
                    {t.footer.careers}
                  </Link>
                </li>
                <li>
                  <Link href="/" className="flex min-h-10 items-center text-sm font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] active:text-[var(--text-primary)] sm:min-h-0">
                    {t.footer.privacy}
                  </Link>
                </li>
                <li>
                  <Link href="/" className="flex min-h-10 items-center text-sm font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] active:text-[var(--text-primary)] sm:min-h-0">
                    {t.footer.terms}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="mt-20 flex flex-col items-center justify-between border-t border-[var(--border)] pt-8 md:flex-row">
          <p className="text-sm text-[var(--text-muted)]">
            &copy; 2026 Zinvest. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
