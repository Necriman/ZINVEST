"use client";

import React, { useState, useEffect, useRef } from "react";
import { Globe, ChevronDown, Menu, X, Sparkles, Check, LogOut, Shield, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/language-context";
import { Language } from "@/lib/translations";
import { useAuth } from "@/lib/auth-context";

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "uz", label: "O'zbek", flag: "🇺🇿" },
];

const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();

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

  const navLinks = [
    { label: t.nav.howItWorks, href: "/#how-it-works" },
    { label: t.nav.learning, href: "/#learning" },
    { label: t.nav.learningPaths, href: "/#finance-tracks" },
    { label: t.nav.whoItsFor, href: "/#who-its-for" },
    { label: t.nav.zinvestAI, href: "/turbo-ai", isAI: true },
  ];

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  const userInitials = user ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "";

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "py-3" : "py-4"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div
          className={`flex items-center justify-between rounded-full px-6 py-3 transition-all duration-300 ${
            scrolled
              ? "glass-card shadow-lg shadow-black/10"
              : "bg-white/5 backdrop-blur-sm border border-white/10"
          }`}
        >
          {/* Logo */}
          <Link href="/" className="group">
            <Image
              src="/zinvest-logo.svg"
              alt="Zinvest"
              width={160}
              height={46}
              priority
              className="h-9 w-auto transition-transform group-hover:scale-[1.02]"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  link.isAI
                    ? "text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {link.isAI && <Sparkles className="h-3.5 w-3.5" />}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side - Language, Auth & CTA */}
          <div className="hidden items-center gap-3 md:flex">
            {/* Language Selector */}
            <div className="relative" ref={langDropdownRef}>
              <button 
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-white hover:bg-white/5"
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
                    className="absolute right-0 mt-2 w-44 rounded-xl border border-white/10 bg-[#0d1117]/95 backdrop-blur-lg shadow-xl overflow-hidden"
                  >
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-4 py-3 text-sm transition-colors hover:bg-white/5 ${
                          language === lang.code ? "text-blue-400" : "text-slate-300"
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
                  className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 pl-1.5 pr-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-white/10"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white">
                    {userInitials}
                  </div>
                  <span className="max-w-[100px] truncate text-slate-300">{user.name.split(" ")[0]}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#0d1117]/95 backdrop-blur-lg shadow-xl overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm font-medium text-white truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                      {user.isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <Shield className="h-4 w-4 text-blue-400" />
                          {t.auth.adminPortal}
                        </Link>
                      )}
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <User className="h-4 w-4 text-blue-400" />
                        My Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          signOut();
                          setUserMenuOpen(false);
                        }}
                        className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-red-400 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        {t.auth.signOut}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white hover:bg-white/5"
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
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-3 rounded-3xl border border-white/10 bg-[#0d1117]/95 p-6 backdrop-blur-lg md:hidden"
            >
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`rounded-xl px-4 py-3 text-base font-medium transition-colors hover:bg-white/5 ${
                      link.isAI
                        ? "text-blue-400 hover:text-blue-300 flex items-center gap-2"
                        : "text-slate-300 hover:text-white"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.isAI && <Sparkles className="h-4 w-4" />}
                    {link.label}
                  </Link>
                ))}
                
                {/* Mobile Language Selector */}
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="px-4 text-xs text-slate-500 mb-2">Language</p>
                  <div className="flex gap-2 px-4">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                          language === lang.code 
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                            : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.code.toUpperCase()}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Mobile Auth Section */}
                <div className="mt-4 border-t border-white/10 pt-4">
                  {user ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 px-4 py-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white">
                          {userInitials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                      {user.isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-base font-medium text-slate-300 hover:bg-white/5 transition-colors"
                        >
                          <Shield className="h-4 w-4 text-blue-400" />
                          {t.auth.adminPortal}
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          signOut();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-base font-medium text-red-400 hover:bg-white/5 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        {t.auth.signOut}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Link
                        href="/sign-in"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full rounded-full border border-white/10 py-3 text-center text-base font-medium text-slate-300 transition-all hover:bg-white/5"
                      >
                        {t.auth.signIn}
                      </Link>
                      <Link
                        href="/sign-up"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full rounded-full bg-blue-500 py-3 text-center text-base font-medium text-white transition-all hover:bg-blue-600"
                      >
                        {t.auth.signUp}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navigation;
