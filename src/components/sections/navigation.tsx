"use client";

import React, { useState, useEffect, useRef } from "react";
import { Globe, ChevronDown, Menu, X, Check, LogOut, Shield, User, Settings, BarChart3, Wallet, Sun, Moon, Instagram, Send } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/language-context";
import { Language } from "@/lib/translations";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/components/theme-provider";

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "uz", label: "O'zbek", flag: "🇺🇿" },
];
const INSTAGRAM_URL = "https://www.instagram.com/zinvest.app?igsh=MTE3cW1ndHI2cnFsbg==";
const TELEGRAM_URL = "https://t.me/zinvestapp";

const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("how-it-works");
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const logoSrc = "/zinvest-mark.svg";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: t.nav.howItWorks, href: "/#how-it-works", sectionId: "how-it-works" },
    { label: t.nav.learning, href: "/#learning", sectionId: "learning" },
    { label: t.nav.learningPaths, href: "/#finance-tracks", sectionId: "finance-tracks" },
    { label: t.nav.whoItsFor, href: "/#who-its-for", sectionId: "who-its-for" },
    { label: t.nav.zinvestAI, href: "/ai", isAI: true },
  ];

  useEffect(() => {
    if (pathname !== "/") return;
    const sectionIds = ["how-it-works", "learning", "finance-tracks", "who-its-for"];
    const observers = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    if (!observers.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSection(visible.target.id);
      },
      { threshold: [0.2, 0.4, 0.6], rootMargin: "-30% 0px -55% 0px" },
    );

    observers.forEach((section) => io.observe(section));
    return () => io.disconnect();
  }, [pathname]);

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
  const navProgressLabel =
    language === "ru" ? "Мой прогресс" : language === "uz" ? "Mening progressim" : "My Progress";
  const navSettingsLabel =
    language === "ru" ? "Настройки" : language === "uz" ? "Sozlamalar" : "Settings";
  const openMenuLabel =
    language === "ru" ? "Открыть меню" : language === "uz" ? "Menyuni ochish" : "Open menu";
  const closeMenuLabel =
    language === "ru" ? "Закрыть меню" : language === "uz" ? "Menyuni yopish" : "Close menu";
  const mainMenuLabel =
    language === "ru" ? "Главное меню" : language === "uz" ? "Asosiy menyu" : "Main menu";

  const userInitials = user ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "";

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 transition-all duration-300 ${
        mobileMenuOpen ? "z-[200]" : "z-50"
      } ${scrolled ? "py-2 sm:py-3" : "py-3 sm:py-4"}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div
          className={`flex items-center justify-between rounded-full px-3 py-2.5 transition-all duration-300 sm:px-6 sm:py-3 ${
            scrolled
              ? "glass-card shadow-[var(--shadow-navbar)]"
              : "border backdrop-blur-xl shadow-[var(--shadow-navbar)]"
          }`}
          style={
            !scrolled
              ? { backgroundColor: "var(--bg-navbar)", borderColor: "var(--border-navbar)" }
              : undefined
          }
        >
          {/* Logo + social */}
          <div className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
            <Link href="/" className="group min-h-11 min-w-0 shrink flex items-center touch-manipulation active:opacity-90">
              <Image
                src={logoSrc}
                alt="Zinvest"
                width={32}
                height={32}
                priority
                className="h-8 w-8 transition-transform group-hover:scale-[1.02]"
              />
            </Link>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-9 w-9 items-center justify-center rounded-full text-[var(--text-nav)] transition-colors hover:bg-[var(--accent-bg)] hover:text-[var(--text-nav-active)] md:flex"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-9 w-9 items-center justify-center rounded-full text-[var(--text-nav)] transition-colors hover:bg-[var(--accent-bg)] hover:text-[var(--text-nav-active)] md:flex"
              aria-label="Telegram"
            >
              <Send className="h-4 w-4" />
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <div className="ml-6 hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  link.isAI
                    ? "flex items-center gap-1 text-[var(--text-nav-active)] hover:text-[var(--accent-hover)]"
                    : pathname === "/" && link.sectionId === activeSection
                      ? "rounded-full bg-[var(--accent-bg)] text-[var(--text-nav-active)]"
                      : "text-[var(--text-nav)] hover:text-[var(--text-nav-active)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side - Language, Auth & CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-[var(--text-nav)] transition-colors hover:text-[var(--text-nav-active)] hover:bg-[var(--accent-bg)]"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-[var(--text-secondary)]" /> : <Moon className="h-4 w-4 text-[var(--text-primary)]" />}
            </button>

            {/* Language Selector */}
            <div className="relative" ref={langDropdownRef}>
              <button 
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-[var(--text-nav)] transition-colors hover:text-[var(--text-nav-active)] hover:bg-[var(--accent-bg)]"
              >
                <Globe className="h-4 w-4" />
                <span>{currentLang.flag} {currentLang.code.toUpperCase()}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${langDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              <AnimatePresence>
                {langDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border backdrop-blur-lg shadow-lg"
                    style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}
                  >
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-4 py-3 text-sm transition-colors hover:bg-[var(--accent-bg)] ${
                          language === lang.code ? "text-[var(--text-nav-active)]" : "text-[var(--text-secondary)]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </span>
                        {language === lang.code && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Auth Section */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] pl-1.5 pr-3 py-1.5 text-sm font-medium text-[var(--text-primary)] transition-all hover:bg-[var(--accent-bg)]"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white">
                    {userInitials}
                  </div>
                  <span className="max-w-[100px] truncate text-[var(--text-secondary)]">{user.name.split(" ")[0]}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-[var(--text-muted)] transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border shadow-xl backdrop-blur-lg"
                      style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}
                    >
                      <div className="border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">{user.name}</p>
                        <p className="truncate text-xs text-[var(--text-muted)]">{user.email}</p>
                      </div>
                      {user.isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--accent-bg)] hover:text-[var(--text-primary)]"
                        >
                          <Shield className="h-4 w-4 text-blue-500" />
                          {t.auth.adminPortal}
                        </Link>
                      )}
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--accent-bg)] hover:text-[var(--text-primary)]"
                      >
                        <User className="h-4 w-4 text-blue-500" />
                        {t.navExtra.myDashboard}
                      </Link>
                      <Link
                        href="/modules"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--accent-bg)] hover:text-[var(--text-primary)]"
                      >
                        <BarChart3 className="h-4 w-4 text-blue-500" />
                        {navProgressLabel}
                      </Link>
                      <Link
                        href="/cash-flow"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--accent-bg)] hover:text-[var(--text-primary)]"
                      >
                        <Wallet className="h-4 w-4 text-violet-500" />
                        {t.navExtra.cashFlow}
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--accent-bg)] hover:text-[var(--text-primary)]"
                      >
                        <Settings className="h-4 w-4 text-blue-500" />
                        {navSettingsLabel}
                      </Link>
                      <button
                        onClick={() => {
                          signOut();
                          setUserMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 border-t px-4 py-3 text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-500/10 dark:hover:text-red-200"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900 dark:text-white hover:bg-slate-100"
                >
                  {t.auth.signIn}
                </Link>
                <Link href="/sign-up">
                  <span className="relative group">
                    <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 opacity-50 blur transition-opacity group-hover:opacity-75"></span>
                    <span className="relative flex h-10 items-center justify-center rounded-full bg-blue-500 px-5 text-sm font-medium text-white transition-all hover:bg-blue-600">
                      {t.auth.signUp}
                    </span>
                  </span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? closeMenuLabel : openMenuLabel}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white dark:bg-[#0a0f1c] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 transition-transform touch-manipulation active:scale-95 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile: fullscreen overlay + sheet */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              key="mobile-nav-overlay"
              className="fixed inset-0 z-[210] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <button
                type="button"
                aria-label={closeMenuLabel}
                className="absolute inset-0 bg-black/65 backdrop-blur-md transition-opacity touch-manipulation"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label={mainMenuLabel}
                className="absolute inset-0 flex flex-col bg-white dark:bg-[#0a0f1c] shadow-2xl"
                style={{
                  paddingTop: "max(0.75rem, env(safe-area-inset-top))",
                  paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
                }}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-[var(--border)] px-4 pb-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href="/"
                      className="flex min-h-11 items-center touch-manipulation active:opacity-90"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Image
                        src={logoSrc}
                        alt="Zinvest"
                        width={32}
                        height={32}
                        className="h-8 w-8"
                      />
                    </Link>
                    <a
                      href={INSTAGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-nav)] transition-colors hover:bg-[var(--accent-bg)] hover:text-[var(--text-nav-active)]"
                      aria-label="Instagram"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                    <a
                      href={TELEGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-nav)] transition-colors hover:bg-[var(--accent-bg)] hover:text-[var(--text-nav-active)]"
                      aria-label="Telegram"
                    >
                      <Send className="h-4 w-4" />
                    </a>
                  </div>
                  <button
                    type="button"
                    aria-label={closeMenuLabel}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-800 transition-transform touch-manipulation active:scale-95 dark:bg-[#0a0f1c]/10 dark:text-white"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-4">
                  <div className="flex flex-col gap-1">
                    {navLinks.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        className={`flex min-h-12 items-center rounded-xl px-4 text-[15px] font-medium transition-colors duration-200 active:bg-slate-100 dark:active:bg-[#0a0f1c]/10 ${
                          link.isAI
                            ? "text-[var(--accent)]"
                            : "text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-[#0a0f1c]/5"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>

                  {user && (
                    <div className="mt-6 border-t border-[var(--border)] pt-6">
                      <p className="mb-2 px-4 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t.auth.myAccount}
                      </p>
                      <div className="flex flex-col gap-1">
                        <Link
                          href="/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-[15px] text-slate-800 transition-colors active:bg-slate-100 dark:text-slate-200 dark:active:bg-[#0a0f1c]/10"
                        >
                          <User className="h-4 w-4 shrink-0 text-blue-500" />
                          {t.navExtra.myDashboard}
                        </Link>
                        <Link
                          href="/modules"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-[15px] text-slate-800 transition-colors active:bg-slate-100 dark:text-slate-200 dark:active:bg-[#0a0f1c]/10"
                        >
                          <BarChart3 className="h-4 w-4 shrink-0 text-blue-500" />
                          {navProgressLabel}
                        </Link>
                        <Link
                          href="/cash-flow"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-[15px] text-slate-800 transition-colors active:bg-slate-100 dark:text-slate-200 dark:active:bg-[#0a0f1c]/10"
                        >
                          <Wallet className="h-4 w-4 shrink-0 text-violet-500" />
                          {t.navExtra.cashFlow}
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-[15px] text-slate-800 transition-colors active:bg-slate-100 dark:text-slate-200 dark:active:bg-[#0a0f1c]/10"
                        >
                          <Settings className="h-4 w-4 shrink-0 text-blue-500" />
                          {navSettingsLabel}
                        </Link>
                        {user.isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-[15px] text-slate-800 transition-colors active:bg-slate-100 dark:text-slate-200 dark:active:bg-[#0a0f1c]/10"
                          >
                            <Shield className="h-4 w-4 shrink-0 text-blue-500" />
                            {t.auth.adminPortal}
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 border-t border-[var(--border)] pt-6">
                    <p className="mb-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {t.navExtra.language}
                    </p>
                    <div className="flex flex-wrap gap-2 px-2">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => setLanguage(lang.code)}
                          className={`flex min-h-11 min-w-[4.5rem] items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-colors duration-200 touch-manipulation active:scale-[0.98] ${
                            language === lang.code
                              ? "border-blue-500/40 bg-blue-100 text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/20 dark:text-blue-200"
                              : "border-slate-200 bg-slate-50 text-slate-600 active:bg-slate-100 dark:border-white/10 dark:bg-[#0a0f1c]/5 dark:text-slate-300 dark:active:bg-[#0a0f1c]/10"
                          }`}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.code.toUpperCase()}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto border-t border-[var(--border)] pt-6">
                    {user ? (
                      <div className="flex flex-col gap-3 px-2">
                        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 dark:bg-[#0a0f1c]/5">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white">
                            {userInitials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            signOut();
                            setMobileMenuOpen(false);
                          }}
                          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 text-[15px] font-medium text-red-300 transition-colors touch-manipulation active:bg-red-500/20"
                        >
                          <LogOut className="h-4 w-4" />
                          {t.auth.signOut}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 px-2">
                        <Link
                          href="/sign-in"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white text-[15px] font-medium text-slate-800 transition-colors active:bg-slate-100 dark:border-white/15 dark:bg-[#0a0f1c]/5 dark:text-white dark:active:bg-[#0a0f1c]/10"
                        >
                          {t.auth.signIn}
                        </Link>
                        <Link
                          href="/sign-up"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex min-h-12 items-center justify-center rounded-full bg-blue-500 text-[15px] font-semibold text-white transition-colors active:bg-blue-600"
                        >
                          {t.auth.signUp}
                        </Link>
                      </div>
                    )}
                  </div>
                </nav>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navigation;
