export type QuestionType = "number" | "choice";

export type QuestionId =
  | "relationship"
  | "contract"
  | "contract_reason"
  | "identity_verified"
  | "past_defaults"
  | "stable_income_proof"
  | "documentation_completeness"
  | "transparency"
  | "urgency"
  | "collateral_provided"
  | "penalty_terms_present"
  | "delivery_reliability"
  | "guaranteed_return"
  | "amount"
  | "income"
  | "repayment_plan"
  | "savings"
  | "deadline";

export type Question = {
  id: QuestionId;
  text: string;
  type: QuestionType;
  category:
    | "counterparty"
    | "contract"
    | "deal_terms"
    | "scenario"
    | "user_capacity"
    | "money";
  weight: number;
  options?: string[];
};

// Central question catalog used by the adaptive question flow + scoring engine.
// Note: UI chips map to these `id`s and expect specific tokens/values (e.g. "known"/"unknown").
export const questions: Record<"lend" | "investment" | "purchase" | "installment", Question[]> = {
  lend: [
    {
      id: "contract",
      text: "Is there a formal written agreement for this deal?",
      type: "choice",
      category: "contract",
      weight: 0.22,
      options: ["true", "false"],
    },
    {
      id: "contract_reason",
      text: "Why is there no written agreement?",
      type: "choice",
      category: "contract",
      weight: 0.1,
      options: ["verbal", "missing_terms", "not_sure"],
    },
    {
      id: "relationship",
      text: "How many financial interactions have you had with this person?",
      type: "choice",
      category: "counterparty",
      weight: 0.18,
      options: ["known", "unknown"],
    },
    {
      id: "identity_verified",
      text: "Have you verified their identity/registration data?",
      type: "choice",
      category: "counterparty",
      weight: 0.12,
      options: ["verified", "partial", "not_verified"],
    },
    {
      id: "past_defaults",
      text: "Has this person ever failed to repay money?",
      type: "choice",
      category: "counterparty",
      weight: 0.14,
      options: ["never", "once", "many"],
    },
    {
      id: "stable_income_proof",
      text: "Do they have verifiable and stable income proof?",
      type: "choice",
      category: "counterparty",
      weight: 0.1,
      options: ["verified", "partial", "none"],
    },
    {
      id: "documentation_completeness",
      text: "How complete are supporting documents (IDs, proofs, receipts)?",
      type: "choice",
      category: "deal_terms",
      weight: 0.08,
      options: ["complete", "partial", "none"],
    },
    {
      id: "transparency",
      text: "How transparent are the documents and deal terms?",
      type: "choice",
      category: "deal_terms",
      weight: 0.1,
      options: ["high", "medium", "low"],
    },
    {
      id: "urgency",
      text: "Is there strong time pressure (\"need it urgently\")?",
      type: "choice",
      category: "deal_terms",
      weight: 0.1,
      options: ["low", "medium", "high"],
    },
    {
      id: "collateral_provided",
      text: "Is there collateral/guarantee (asset, guarantor, pledge)?",
      type: "choice",
      category: "scenario",
      weight: 0.1,
      options: ["true", "false"],
    },
    {
      id: "amount",
      text: "Deal amount (USD).",
      type: "number",
      category: "money",
      weight: 0.25,
    },
    {
      id: "income",
      text: "Your monthly income (USD).",
      type: "number",
      category: "money",
      weight: 0.25,
    },
    {
      id: "repayment_plan",
      text: "If income drops, what is your repayment plan?",
      type: "choice",
      category: "user_capacity",
      weight: 0.05,
      options: ["conservative", "moderate", "aggressive"],
    },
    {
      id: "savings",
      text: "How much free savings do you have (USD)?",
      type: "number",
      category: "user_capacity",
      weight: 0.2,
    },
    {
      id: "deadline",
      text: "Repayment/payment term in days.",
      type: "number",
      category: "user_capacity",
      weight: 0.2,
    },
  ],

  investment: [
    {
      id: "contract",
      text: "Is there a formal written agreement/terms for this investment?",
      type: "choice",
      category: "contract",
      weight: 0.2,
      options: ["true", "false"],
    },
    {
      id: "contract_reason",
      text: "Why is there no written agreement?",
      type: "choice",
      category: "contract",
      weight: 0.1,
      options: ["verbal", "missing_terms", "not_sure"],
    },
    {
      id: "relationship",
      text: "How many financial interactions have you had with this counterparty/platform?",
      type: "choice",
      category: "counterparty",
      weight: 0.18,
      options: ["known", "unknown"],
    },
    {
      id: "identity_verified",
      text: "Have you verified their identity/registration data?",
      type: "choice",
      category: "counterparty",
      weight: 0.12,
      options: ["verified", "partial", "not_verified"],
    },
    {
      id: "past_defaults",
      text: "Has this counterparty ever failed to repay money / deliver as promised?",
      type: "choice",
      category: "counterparty",
      weight: 0.12,
      options: ["never", "once", "many"],
    },
    {
      id: "stable_income_proof",
      text: "Do they have verifiable and stable income/cashflow proof?",
      type: "choice",
      category: "counterparty",
      weight: 0.1,
      options: ["verified", "partial", "none"],
    },
    {
      id: "documentation_completeness",
      text: "How complete are supporting documents (terms, licenses, statements)?",
      type: "choice",
      category: "deal_terms",
      weight: 0.08,
      options: ["complete", "partial", "none"],
    },
    {
      id: "transparency",
      text: "How transparent are the documents and deal terms?",
      type: "choice",
      category: "deal_terms",
      weight: 0.1,
      options: ["high", "medium", "low"],
    },
    {
      id: "urgency",
      text: "Is there strong time pressure (\"need it urgently\")?",
      type: "choice",
      category: "deal_terms",
      weight: 0.1,
      options: ["low", "medium", "high"],
    },
    {
      id: "guaranteed_return",
      text: "Are they promising guaranteed profit/fixed returns?",
      type: "choice",
      category: "scenario",
      weight: 0.14,
      options: ["true", "false"],
    },
    {
      id: "amount",
      text: "Investment amount (USD).",
      type: "number",
      category: "money",
      weight: 0.25,
    },
    {
      id: "income",
      text: "Your monthly income/free cash (USD).",
      type: "number",
      category: "money",
      weight: 0.25,
    },
    {
      id: "repayment_plan",
      text: "If income drops, what is your repayment plan?",
      type: "choice",
      category: "user_capacity",
      weight: 0.05,
      options: ["conservative", "moderate", "aggressive"],
    },
    {
      id: "savings",
      text: "How much free savings do you have (USD)?",
      type: "number",
      category: "user_capacity",
      weight: 0.2,
    },
    {
      id: "deadline",
      text: "Holding horizon in days.",
      type: "number",
      category: "user_capacity",
      weight: 0.2,
    },
  ],

  purchase: [
    {
      id: "contract",
      text: "Is there a formal written agreement/confirmation for this purchase?",
      type: "choice",
      category: "contract",
      weight: 0.2,
      options: ["true", "false"],
    },
    {
      id: "contract_reason",
      text: "Why is there no written agreement?",
      type: "choice",
      category: "contract",
      weight: 0.1,
      options: ["verbal", "missing_terms", "not_sure"],
    },
    {
      id: "relationship",
      text: "Do you know the seller/supplier and trust them?",
      type: "choice",
      category: "counterparty",
      weight: 0.18,
      options: ["known", "unknown"],
    },
    {
      id: "identity_verified",
      text: "Have you verified their identity/registration data?",
      type: "choice",
      category: "counterparty",
      weight: 0.12,
      options: ["verified", "partial", "not_verified"],
    },
    {
      id: "past_defaults",
      text: "Has this supplier ever failed to deliver or repay as promised?",
      type: "choice",
      category: "counterparty",
      weight: 0.14,
      options: ["never", "once", "many"],
    },
    {
      id: "stable_income_proof",
      text: "Do they show stable business income/cashflow proof?",
      type: "choice",
      category: "counterparty",
      weight: 0.1,
      options: ["verified", "partial", "none"],
    },
    {
      id: "documentation_completeness",
      text: "How complete are supporting documents (invoice, terms, delivery proof)?",
      type: "choice",
      category: "deal_terms",
      weight: 0.08,
      options: ["complete", "partial", "none"],
    },
    {
      id: "transparency",
      text: "How transparent are the documents and deal terms?",
      type: "choice",
      category: "deal_terms",
      weight: 0.1,
      options: ["high", "medium", "low"],
    },
    {
      id: "urgency",
      text: "Is there strong time pressure (\"need it urgently\")?",
      type: "choice",
      category: "deal_terms",
      weight: 0.1,
      options: ["low", "medium", "high"],
    },
    {
      id: "delivery_reliability",
      text: "How reliable is delivery/execution by the supplier?",
      type: "choice",
      category: "scenario",
      weight: 0.12,
      options: ["reliable", "uncertain", "unknown"],
    },
    {
      id: "amount",
      text: "Purchase cost (USD).",
      type: "number",
      category: "money",
      weight: 0.25,
    },
    {
      id: "income",
      text: "Your monthly income to cover costs (USD).",
      type: "number",
      category: "money",
      weight: 0.25,
    },
    {
      id: "repayment_plan",
      text: "If income drops, what is your repayment plan?",
      type: "choice",
      category: "user_capacity",
      weight: 0.05,
      options: ["conservative", "moderate", "aggressive"],
    },
    {
      id: "savings",
      text: "How much free savings do you have (USD)?",
      type: "number",
      category: "user_capacity",
      weight: 0.2,
    },
    {
      id: "deadline",
      text: "Payment/repayment term in days.",
      type: "number",
      category: "user_capacity",
      weight: 0.2,
    },
  ],

  installment: [
    {
      id: "contract",
      text: "Is there a formal written installment agreement/schedule?",
      type: "choice",
      category: "contract",
      weight: 0.2,
      options: ["true", "false"],
    },
    {
      id: "contract_reason",
      text: "Why is there no written agreement?",
      type: "choice",
      category: "contract",
      weight: 0.1,
      options: ["verbal", "missing_terms", "not_sure"],
    },
    {
      id: "relationship",
      text: "Do you know the seller/supplier and trust them?",
      type: "choice",
      category: "counterparty",
      weight: 0.18,
      options: ["known", "unknown"],
    },
    {
      id: "identity_verified",
      text: "Have you verified their identity/registration data?",
      type: "choice",
      category: "counterparty",
      weight: 0.12,
      options: ["verified", "partial", "not_verified"],
    },
    {
      id: "past_defaults",
      text: "Has this supplier ever failed to deliver or repay as promised?",
      type: "choice",
      category: "counterparty",
      weight: 0.14,
      options: ["never", "once", "many"],
    },
    {
      id: "stable_income_proof",
      text: "Do they show stable business income/cashflow proof?",
      type: "choice",
      category: "counterparty",
      weight: 0.1,
      options: ["verified", "partial", "none"],
    },
    {
      id: "documentation_completeness",
      text: "How complete are supporting documents (agreement, schedule, receipts)?",
      type: "choice",
      category: "deal_terms",
      weight: 0.08,
      options: ["complete", "partial", "none"],
    },
    {
      id: "transparency",
      text: "How transparent are the documents and deal terms?",
      type: "choice",
      category: "deal_terms",
      weight: 0.1,
      options: ["high", "medium", "low"],
    },
    {
      id: "urgency",
      text: "Is there strong time pressure (\"need it urgently\")?",
      type: "choice",
      category: "deal_terms",
      weight: 0.1,
      options: ["low", "medium", "high"],
    },
    {
      id: "penalty_terms_present",
      text: "Are there penalty terms for overdue payments?",
      type: "choice",
      category: "scenario",
      weight: 0.12,
      options: ["true", "false"],
    },
    {
      id: "amount",
      text: "Installment total cost (USD).",
      type: "number",
      category: "money",
      weight: 0.25,
    },
    {
      id: "income",
      text: "Your monthly income for installment payments (USD).",
      type: "number",
      category: "money",
      weight: 0.25,
    },
    {
      id: "repayment_plan",
      text: "If income drops, what is your repayment plan?",
      type: "choice",
      category: "user_capacity",
      weight: 0.05,
      options: ["conservative", "moderate", "aggressive"],
    },
    {
      id: "savings",
      text: "How much free savings do you have (USD)?",
      type: "number",
      category: "user_capacity",
      weight: 0.2,
    },
    {
      id: "deadline",
      text: "Repayment term in days.",
      type: "number",
      category: "user_capacity",
      weight: 0.2,
    },
  ],
};

