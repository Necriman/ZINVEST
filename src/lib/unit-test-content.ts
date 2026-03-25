export type UnitKey =
  | "finance-fundamentals"
  | "investing-basics"
  | "financial-analysis"
  | "personal-finance";

export type ChoiceIndex = number;

export type UnitTestQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: ChoiceIndex;
};

export type UnitTest = {
  unitKey: UnitKey;
  title: string;
  questions: UnitTestQuestion[];
};

export const UNIT_TESTS: Record<UnitKey, UnitTest> = {
  "finance-fundamentals": {
    unitKey: "finance-fundamentals",
    title: "Finance Fundamentals Unit Test",
    questions: [
      {
        id: "ff-q1",
        prompt: "Revenue and profit are the same thing. True or false?",
        options: ["True", "False"],
        correctIndex: 1,
      },
      {
        id: "ff-q2",
        prompt: "Which one is cash moved in/out of the business (not accounting profit)?",
        options: ["Profit", "Cash flow", "Revenue"],
        correctIndex: 1,
      },
      {
        id: "ff-q3",
        prompt: "A budget is mainly for:",
        options: ["Forecasting taxes only", "Planning and controlling money"],
        correctIndex: 1,
      },
      {
        id: "ff-q4",
        prompt: "Why can a business show profit and still run out of cash?",
        options: [
          "Because cash and profit are always identical",
          "Because timing of cash payments/receipts can differ",
          "Because profit automatically means cash is available immediately",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-q5",
        prompt: "What is the emergency fund purpose?",
        options: ["Investments in stocks", "Cushion for unexpected expenses"],
        correctIndex: 1,
      },
    ],
  },
  "investing-basics": {
    unitKey: "investing-basics",
    title: "Investing Basics Unit Test",
    questions: [
      {
        id: "ib-q1",
        prompt: "Diversification primarily helps reduce:",
        options: ["All risks to zero", "Single-asset (or single sector) risk", "Inflation automatically"],
        correctIndex: 1,
      },
      {
        id: "ib-q2",
        prompt: "An ETF is usually:",
        options: ["A single stock", "A fund that holds a basket of assets", "A savings account"],
        correctIndex: 1,
      },
      {
        id: "ib-q3",
        prompt: "Risk and return are typically:",
        options: [
          "Unrelated",
          "Often linked (higher potential return usually comes with higher risk)",
          "Always inversely related",
        ],
        correctIndex: 1,
      },
      {
        id: "ib-q4",
        prompt: "Compound interest means:",
        options: ["You only earn interest on the initial amount", "Interest earns interest over time", "Interest is fixed and never grows"],
        correctIndex: 1,
      },
      {
        id: "ib-q5",
        prompt: "Long-term investing is generally about:",
        options: ["Eliminating volatility completely", "Allowing time for growth and compounding", "Buying only during one day"],
        correctIndex: 1,
      },
    ],
  },
  "financial-analysis": {
    unitKey: "financial-analysis",
    title: "Financial Analysis Unit Test",
    questions: [
      {
        id: "fa-q1",
        prompt: "A balance sheet mainly reports:",
        options: ["Cash received this month", "Assets, liabilities, and equity at a point in time", "Revenue every day"],
        correctIndex: 1,
      },
      {
        id: "fa-q2",
        prompt: "Income statement is best described as:",
        options: ["A snapshot of what you own at one moment", "A summary of performance over a period", "A list of only debts"],
        correctIndex: 1,
      },
      {
        id: "fa-q3",
        prompt: "If liabilities increase, equity often:",
        options: ["Must always increase", "May decrease or increase depending on assets", "Always stays the same"],
        correctIndex: 1,
      },
      {
        id: "fa-q4",
        prompt: "Cash flow analysis helps you understand:",
        options: ["Whether cash is actually coming in and going out", "Only accounting profit", "Only stock prices"],
        correctIndex: 0,
      },
      {
        id: "fa-q5",
        prompt: "Which metric is most directly about ability to repay short-term obligations?",
        options: ["Liquidity / solvency ratios", "Random emoji score", "Brand awareness"],
        correctIndex: 0,
      },
    ],
  },
  "personal-finance": {
    unitKey: "personal-finance",
    title: "Personal Finance Unit Test",
    questions: [
      {
        id: "pf-q1",
        prompt: "A credit score is mainly used to assess:",
        options: ["Market trends", "Creditworthiness", "Cooking skills"],
        correctIndex: 1,
      },
      {
        id: "pf-q2",
        prompt: "Debt management is about:",
        options: ["Ignoring repayment", "Planning repayments and reducing interest cost over time", "Taking more debt without a plan"],
        correctIndex: 1,
      },
      {
        id: "pf-q3",
        prompt: "Budgeting helps you:",
        options: ["Avoid all expenses", "Make trade-offs and align spending with goals", "Only track investment returns"],
        correctIndex: 1,
      },
      {
        id: "pf-q4",
        prompt: "An emergency fund should be:",
        options: ["High volatility and illiquid", "Relatively safe and accessible", "Used for long-term investing immediately"],
        correctIndex: 1,
      },
      {
        id: "pf-q5",
        prompt: "A financial goal with no timeline is usually:",
        options: ["More effective", "Harder to plan and track", "Always identical to a budget"],
        correctIndex: 1,
      },
    ],
  },
};

export const UNIT_META: { key: UnitKey; label: string }[] = [
  { key: "finance-fundamentals", label: "Finance Basics" },
  { key: "investing-basics", label: "Investing Basics" },
  { key: "financial-analysis", label: "Financial Analysis" },
  { key: "personal-finance", label: "Personal Finance" },
];

