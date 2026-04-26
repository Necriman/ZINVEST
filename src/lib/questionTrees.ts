import type { Language } from "@/lib/translations";

export type AdaptiveQuestionId =
  | "item_name"
  | "amount"
  | "monthly_payment"
  | "income"
  | "existing_debts"
  | "interest_rate"
  | "necessity_level"
  | "contract"
  | "relationship"
  | "past_defaults"
  | "identity_verified"
  | "collateral_provided"
  | "loan_purpose"
  | "stable_income_proof"
  | "transparency"
  | "documentation_completeness"
  | "deadline"
  | "expected_return"
  | "guaranteed_return"
  | "founder_known"
  | "business_proof"
  | "revenue_proof"
  | "delivery_reliability"
  | "repayment_plan"
  | "savings";

export type AdaptiveQuestionNode = {
  id: AdaptiveQuestionId;
  priority: number;
  ask: (language: Language) => string;
};

const t = (language: Language, ru: string, en: string, uz: string) =>
  language === "en" ? en : language === "uz" ? uz : ru;

export const questionTrees: Record<
  "installment" | "lend" | "investment" | "purchase" | "supplier",
  AdaptiveQuestionNode[]
> = {
  installment: [
    {
      id: "item_name",
      priority: 100,
      ask: (l) =>
        t(l, "Что именно хотите купить в рассрочку?", "What item do you want to buy on installment?", "Bo'lib to'lashga aynan nima olmoqchisiz?"),
    },
    {
      id: "amount",
      priority: 98,
      ask: (l) =>
        t(l, "Какая общая цена покупки (USD)?", "What is the total price (USD)?", "Umumiy narx qancha (USD)?"),
    },
    {
      id: "monthly_payment",
      priority: 95,
      ask: (l) =>
        t(l, "Какой ежемесячный платеж по рассрочке (USD)?", "What is the monthly installment payment (USD)?", "Oylik to'lov qancha (USD)?"),
    },
    {
      id: "income",
      priority: 94,
      ask: (l) =>
        t(l, "Какой у вас ежемесячный доход (USD)?", "What is your monthly income (USD)?", "Oylik daromadingiz qancha (USD)?"),
    },
    {
      id: "existing_debts",
      priority: 90,
      ask: (l) =>
        t(l, "Есть ли у вас уже активные долги/кредиты (примерно сколько в месяц)?", "Do you already have active debts/loans (rough monthly payment)?", "Hozirgi qarz/kreditlaringiz bormi (oylik taxminan qancha)?"),
    },
    {
      id: "interest_rate",
      priority: 86,
      ask: (l) =>
        t(l, "Какая процентная ставка/переплата по рассрочке?", "What is the interest/markup rate?", "Foiz yoki ustama qancha?"),
    },
    {
      id: "necessity_level",
      priority: 80,
      ask: (l) =>
        t(l, "Это необходимая покупка или можно отложить?", "Is this purchase necessary or optional?", "Bu xarid zarurmi yoki kechiktirish mumkinmi?"),
    },
    {
      id: "contract",
      priority: 78,
      ask: (l) =>
        t(l, "Есть формальный письменный договор? Ответьте: да/нет.", "Is there a formal written contract? Reply: yes/no.", "Rasmiy yozma shartnoma bormi? Javob: ha/yo'q."),
    },
    {
      id: "deadline",
      priority: 72,
      ask: (l) =>
        t(l, "На какой срок рассрочка (в днях)?", "What is the installment term (days)?", "Bo'lib to'lash muddati (kunlarda)?"),
    },
    {
      id: "savings",
      priority: 70,
      ask: (l) =>
        t(l, "Сколько у вас свободных накоплений (USD)?", "How much free savings do you have (USD)?", "Erkin jamg'armangiz qancha (USD)?"),
    },
  ],

  lend: [
    {
      id: "amount",
      priority: 100,
      ask: (l) => t(l, "Какую сумму хотите дать в долг (USD)?", "How much do you plan to lend (USD)?", "Qancha pul qarz bermoqchisiz (USD)?"),
    },
    {
      id: "relationship",
      priority: 98,
      ask: (l) => t(l, "Вы хорошо знаете заемщика? Ответьте: известно/неизвестно.", "Do you know the borrower well? Reply: known/unknown.", "Qarzdorni yaxshi taniysizmi? Javob: ma'lum/noma'lum."),
    },
    {
      id: "past_defaults",
      priority: 95,
      ask: (l) => t(l, "Были ли у него/нее проблемы с возвратом ранее? никогда/один раз/многократно.", "Any past repayment failures? never/once/many.", "Oldin qaytarmaslik holatlari bo'lganmi? hech qachon/bir marta/ko'p."),
    },
    {
      id: "contract",
      priority: 93,
      ask: (l) => t(l, "Есть письменный договор? да/нет.", "Is there a written contract? yes/no.", "Yozma shartnoma bormi? ha/yo'q."),
    },
    {
      id: "collateral_provided",
      priority: 88,
      ask: (l) => t(l, "Есть залог/обеспечение? да/нет.", "Is there collateral? yes/no.", "Garov/ta'minot bormi? ha/yo'q."),
    },
    {
      id: "loan_purpose",
      priority: 82,
      ask: (l) => t(l, "Зачем заемщику нужны деньги?", "Why does the borrower need this money?", "Qarzdorga bu pul nima uchun kerak?"),
    },
    {
      id: "deadline",
      priority: 76,
      ask: (l) => t(l, "Когда деньги должны быть возвращены (в днях)?", "Repayment deadline in days?", "Qaytarish muddati (kunlarda)?"),
    },
  ],

  investment: [
    {
      id: "amount",
      priority: 100,
      ask: (l) => t(l, "Какую сумму вы хотите инвестировать (USD)?", "How much do you want to invest (USD)?", "Qancha investitsiya qilmoqchisiz (USD)?"),
    },
    {
      id: "expected_return",
      priority: 98,
      ask: (l) => t(l, "Какую доходность вам обещают/ожидаете?", "What return is expected/promised?", "Qanday daromad kutilmoqda/va'da qilinmoqda?"),
    },
    {
      id: "guaranteed_return",
      priority: 96,
      ask: (l) => t(l, "Доходность гарантированная? да/нет.", "Is return guaranteed? yes/no.", "Daromad kafolatlanganmi? ha/yo'q."),
    },
    {
      id: "founder_known",
      priority: 90,
      ask: (l) => t(l, "Кто основатель/контрагент и насколько он проверен?", "Who is the founder/counterparty and how verified are they?", "Asoschi/hamkor kim va qay darajada tekshirilgan?"),
    },
    {
      id: "business_proof",
      priority: 87,
      ask: (l) => t(l, "Есть подтверждение реальности бизнеса (регистрация, документы)?", "Is there proof the business is real (registration/docs)?", "Biznes haqiqiyligini tasdiqlovchi hujjatlar bormi?"),
    },
    {
      id: "revenue_proof",
      priority: 84,
      ask: (l) => t(l, "Есть доказательства выручки/денежного потока?", "Any proof of revenue/cashflow?", "Tushum/pul oqimi bo'yicha isbot bormi?"),
    },
    {
      id: "contract",
      priority: 80,
      ask: (l) => t(l, "Есть формальный инвестиционный договор? да/нет.", "Is there a formal investment agreement? yes/no.", "Rasmiy investitsiya shartnomasi bormi? ha/yo'q."),
    },
  ],

  purchase: [
    {
      id: "item_name",
      priority: 100,
      ask: (l) => t(l, "Что хотите купить?", "What do you want to buy?", "Nima sotib olmoqchisiz?"),
    },
    {
      id: "amount",
      priority: 97,
      ask: (l) => t(l, "Сколько стоит покупка (USD)?", "What is the purchase cost (USD)?", "Xarid narxi qancha (USD)?"),
    },
    {
      id: "relationship",
      priority: 93,
      ask: (l) => t(l, "Продавец вам знаком? известно/неизвестно.", "Do you know the seller? known/unknown.", "Sotuvchi sizga tanishmi? ma'lum/noma'lum."),
    },
    {
      id: "delivery_reliability",
      priority: 90,
      ask: (l) => t(l, "Насколько надежна поставка? надежно/неясно/неизвестно.", "How reliable is delivery? reliable/uncertain/unknown.", "Yetkazib berish qanchalik ishonchli? ishonchli/noaniq/noma'lum."),
    },
    {
      id: "contract",
      priority: 85,
      ask: (l) => t(l, "Есть письменное подтверждение условий покупки? да/нет.", "Written purchase confirmation exists? yes/no.", "Xarid shartlari yozma tasdiqlanganmi? ha/yo'q."),
    },
  ],

  supplier: [
    {
      id: "relationship",
      priority: 100,
      ask: (l) => t(l, "Поставщик вам знаком? известно/неизвестно.", "Is the supplier known to you? known/unknown.", "Ta'minotchi sizga tanishmi? ma'lum/noma'lum."),
    },
    {
      id: "delivery_reliability",
      priority: 95,
      ask: (l) => t(l, "Насколько надежен поставщик по срокам? надежно/неясно/неизвестно.", "How reliable is supplier timing? reliable/uncertain/unknown.", "Ta'minotchi muddat bo'yicha qanchalik ishonchli?"),
    },
    {
      id: "documentation_completeness",
      priority: 90,
      ask: (l) => t(l, "Полный ли пакет документов по поставке? полный/частичный/нет.", "Are supply documents complete? complete/partial/none.", "Yetkazib berish hujjatlari to'liqmi? to'liq/qisman/yo'q."),
    },
    {
      id: "contract",
      priority: 88,
      ask: (l) => t(l, "Есть договор поставки? да/нет.", "Is there a supply contract? yes/no.", "Yetkazib berish shartnomasi bormi? ha/yo'q."),
    },
  ],
};

