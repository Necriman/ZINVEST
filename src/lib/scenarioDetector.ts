export type DetectedScenario =
  | "installment"
  | "lend"
  | "investment"
  | "purchase"
  | "supplier";

export function detectScenario(userMessage: string): DetectedScenario {
  const m = (userMessage || "").toLowerCase();

  if (
    m.includes("рассроч") ||
    m.includes("в рассрочку") ||
    m.includes("installment") ||
    m.includes("pay later") ||
    m.includes("bo'lib")
  ) {
    return "installment";
  }

  if (
    m.includes("инвест") ||
    m.includes("investment") ||
    m.includes("startup") ||
    m.includes("стартап") ||
    m.includes("founder")
  ) {
    return "investment";
  }

  if (
    m.includes("одолж") ||
    m.includes("дать в долг") ||
    m.includes("займ") ||
    m.includes("lend") ||
    m.includes("loan to")
  ) {
    return "lend";
  }

  if (
    m.includes("поставщ") ||
    m.includes("supplier") ||
    m.includes("поставка")
  ) {
    return "supplier";
  }

  if (
    m.includes("купить") ||
    m.includes("покупк") ||
    m.includes("заказ") ||
    m.includes("purchase") ||
    m.includes("buy")
  ) {
    return "purchase";
  }

  return "purchase";
}

