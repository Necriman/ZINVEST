"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Check, ChevronLeft, Lock, CreditCard } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

interface PremiumPaywallProps {
  isOpen: boolean;
  onClose: () => void;
}

type PlanKey = "monthly" | "semiAnnual" | "annual";
type PaymentMethod = "visa" | "mastercard" | "paypal" | "uzcard" | "humo" | "click" | "payme";
type Step = "plans" | "checkout";

function VisaIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-6 w-auto" fill="none">
      <rect width="48" height="32" rx="4" fill="#1A1F71" />
      <path d="M19.5 21h-3l1.9-11.5h3L19.5 21zm12.1-11.2c-.6-.2-1.5-.5-2.7-.5-3 0-5.1 1.5-5.1 3.7 0 1.6 1.5 2.5 2.7 3.1 1.2.6 1.6.9 1.6 1.4 0 .8-.9 1.1-1.8 1.1-1.2 0-1.9-.2-2.9-.6l-.4-.2-.4 2.5c.7.3 2.1.6 3.5.6 3.2 0 5.2-1.5 5.2-3.8 0-1.3-.8-2.2-2.5-3-1-.5-1.7-.9-1.7-1.4 0-.5.5-1 1.7-1 1 0 1.7.2 2.2.4l.3.1.3-2.4zm7.9-.3h-2.3c-.7 0-1.3.2-1.6.9L31.5 21h3.2l.6-1.7h3.9l.4 1.7H43L40.3 9.5h-0.8zm-2.7 8.2l1.2-3.3.4-1.1.2 1 .7 3.4h-2.5zM16 9.5l-2.8 7.8-.3-1.5c-.5-1.8-2.2-3.7-4-4.7l2.7 9.9h3.2L19.2 9.5H16z" fill="white" />
      <path d="M10.5 9.5H5.6l-.1.3c3.8.9 6.3 3.2 7.3 5.9l-1-5.3c-.2-.7-.7-.9-1.3-.9z" fill="#F9A533" />
    </svg>
  );
}

function MastercardIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-6 w-auto" fill="none">
      <rect width="48" height="32" rx="4" fill="#252525" />
      <circle cx="19" cy="16" r="8" fill="#EB001B" />
      <circle cx="29" cy="16" r="8" fill="#F79E1B" />
      <path d="M24 10.3a8 8 0 0 1 0 11.4 8 8 0 0 1 0-11.4z" fill="#FF5F00" />
    </svg>
  );
}

function PaypalIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-6 w-auto" fill="none">
      <rect width="48" height="32" rx="4" fill="#003087" />
      <text x="24" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">PayPal</text>
    </svg>
  );
}

function UzcardIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-6 w-auto" fill="none">
      <rect width="48" height="32" rx="4" fill="#00A651" />
      <text x="24" y="20" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="sans-serif">UzCard</text>
    </svg>
  );
}

function HumoIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-6 w-auto" fill="none">
      <rect width="48" height="32" rx="4" fill="#E31E24" />
      <text x="24" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">Humo</text>
    </svg>
  );
}

function ClickIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-6 w-auto" fill="none">
      <rect width="48" height="32" rx="4" fill="#00B4E6" />
      <text x="24" y="20" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Click</text>
    </svg>
  );
}

function PaymeIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-6 w-auto" fill="none">
      <rect width="48" height="32" rx="4" fill="#33CCCC" />
      <text x="24" y="20" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Payme</text>
    </svg>
  );
}

export default function PremiumPaywall({ isOpen, onClose }: PremiumPaywallProps) {
  const { t } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("annual");
  const [step, setStep] = useState<Step>("plans");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("visa");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [cardName, setCardName] = useState("");
  const [processing, setProcessing] = useState(false);

  const plans: { key: PlanKey; price: string; perMonth: string; badge?: string; trial?: boolean; save?: string }[] = [
    { key: "monthly", price: "$14.99", perMonth: "$14.99" },
    { key: "semiAnnual", price: "$59.99", perMonth: "$10.00", save: "33%" },
    { key: "annual", price: "$89.99", perMonth: "$7.50", badge: t.paywall.mostPopular, trial: true, save: "50%" },
  ];

  const features = [
    t.paywall.feature1,
    t.paywall.feature2,
    t.paywall.feature3,
    t.paywall.feature4,
    t.paywall.feature5,
  ];

  const paymentMethods: { key: PaymentMethod; label: string; icon: React.ReactNode; isCard?: boolean }[] = [
    { key: "visa", label: "Visa", icon: <VisaIcon />, isCard: true },
    { key: "mastercard", label: "Mastercard", icon: <MastercardIcon />, isCard: true },
    { key: "paypal", label: "PayPal", icon: <PaypalIcon /> },
    { key: "uzcard", label: "UzCard", icon: <UzcardIcon />, isCard: true },
    { key: "humo", label: "Humo", icon: <HumoIcon />, isCard: true },
    { key: "click", label: "Click", icon: <ClickIcon /> },
    { key: "payme", label: "Payme", icon: <PaymeIcon /> },
    ];

  const currentPlan = plans.find((p) => p.key === selectedPlan)!;
  const currentPayment = paymentMethods.find((p) => p.key === selectedPayment)!;

  const handleClose = () => {
    setStep("plans");
    setProcessing(false);
    setCardNumber("");
    setCardExpiry("");
    setCardCVC("");
    setCardName("");
    onClose();
  };

  const handleSubscribe = () => {
    setStep("checkout");
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      handleClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0d1424] shadow-2xl"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <AnimatePresence mode="wait">
              {step === "plans" ? (
                <motion.div
                  key="plans"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Header */}
                  <div className="relative px-6 pt-8 pb-6 text-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent" />
                    <div className="relative">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
                        <Crown className="h-8 w-8 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">{t.paywall.title}</h2>
                      <p className="text-slate-400 text-sm max-w-sm mx-auto">{t.paywall.subtitle}</p>
                    </div>
                  </div>

                  {/* Plans */}
                  <div className="px-6 space-y-3">
                    {plans.map((plan) => (
                      <button
                        key={plan.key}
                        onClick={() => setSelectedPlan(plan.key)}
                        className={`relative w-full rounded-2xl border p-4 text-left transition-all ${
                          selectedPlan === plan.key
                            ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30"
                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
                        }`}
                      >
                        {plan.badge && (
                          <span className="absolute -top-2.5 left-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                            {plan.badge}
                          </span>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                                selectedPlan === plan.key ? "border-blue-500 bg-blue-500" : "border-slate-500"
                              }`}
                            >
                              {selectedPlan === plan.key && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">
                                  {t.paywall[`${plan.key}Title` as keyof typeof t.paywall]}
                                </span>
                                {plan.save && (
                                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                                    -{plan.save}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-400">
                                {plan.perMonth}/{t.paywall.mo}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-white">{plan.price}</span>
                            {plan.trial && (
                              <p className="text-[10px] font-medium text-blue-400">{t.paywall.trialBadge}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="px-6 mt-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                      {t.paywall.whatsIncluded}
                    </p>
                    <div className="space-y-2.5">
                      {features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2.5">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
                            <Check className="h-3 w-3 text-blue-400" />
                          </div>
                          <span className="text-sm text-slate-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="px-6 pt-6 pb-8">
                    <button
                      onClick={handleSubscribe}
                      className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 py-4 text-center font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:brightness-110 active:scale-[0.98] cursor-pointer"
                    >
                      {selectedPlan === "annual" ? t.paywall.startTrial : t.paywall.subscribe}
                    </button>
                    <p className="mt-3 text-center text-[11px] text-slate-500">
                      {selectedPlan === "annual" ? t.paywall.trialDisclaimer : t.paywall.cancelAnytime}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="checkout"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Checkout Header */}
                  <div className="relative px-6 pt-6 pb-4">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent" />
                    <div className="relative">
                      <button
                        onClick={() => setStep("plans")}
                        className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors mb-4 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        {t.paywall.backToPlan}
                      </button>

                      <h2 className="text-xl font-bold text-white mb-1">{t.paywall.checkout}</h2>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span>{t.paywall[`${selectedPlan}Title` as keyof typeof t.paywall]}</span>
                        <span className="text-white/20">·</span>
                        <span className="text-white font-semibold">{currentPlan.price}</span>
                        {currentPlan.trial && (
                          <>
                            <span className="text-white/20">·</span>
                            <span className="text-blue-400 text-xs">{t.paywall.trialBadge}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="px-6 mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                      {t.paywall.paymentMethod}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.key}
                          onClick={() => setSelectedPayment(method.key)}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all cursor-pointer ${
                            selectedPayment === method.key
                              ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30"
                              : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
                          }`}
                        >
                          {method.icon}
                          <span className="text-[10px] text-slate-400 font-medium">{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card Form or Redirect Info */}
                  <div className="px-6 mb-4">
                    {currentPayment.isCard ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-slate-400 mb-1.5 block">{t.paywall.cardNumber}</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                              placeholder="0000 0000 0000 0000"
                              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-colors"
                              maxLength={19}
                            />
                            <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-slate-400 mb-1.5 block">{t.paywall.cardHolder}</label>
                          <input
                            type="text"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder={t.paywall.cardHolderPlaceholder}
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-colors"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-slate-400 mb-1.5 block">{t.paywall.expiry}</label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                              placeholder="MM/YY"
                              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-colors"
                              maxLength={5}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1.5 block">CVC</label>
                            <input
                              type="text"
                              value={cardCVC}
                              onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, "").slice(0, 4))}
                              placeholder="123"
                              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-colors"
                              maxLength={4}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                        <div className="mb-3">{currentPayment.icon}</div>
                        <p className="text-sm text-slate-300 mb-1">
                          {t.paywall.redirectInfo.replace("{method}", currentPayment.label)}
                        </p>
                        <p className="text-xs text-slate-500">{t.paywall.redirectSub}</p>
                      </div>
                    )}
                  </div>

                  {/* Security Badge */}
                  <div className="px-6 mb-4">
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.03] border border-white/5 py-2.5">
                      <Lock className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-xs text-slate-400">{t.paywall.securePayment}</span>
                    </div>
                  </div>

                  {/* Pay Button */}
                  <div className="px-6 pb-8">
                    <button
                      onClick={handlePay}
                      disabled={processing}
                      className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 py-4 text-center font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:brightness-110 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="inline-block h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                          />
                          {t.paywall.processing}
                        </span>
                      ) : currentPlan.trial ? (
                        t.paywall.startTrial
                      ) : (
                        `${t.paywall.payNow} ${currentPlan.price}`
                      )}
                    </button>
                    <p className="mt-3 text-center text-[11px] text-slate-500">
                      {currentPlan.trial ? t.paywall.trialDisclaimer : t.paywall.cancelAnytime}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
