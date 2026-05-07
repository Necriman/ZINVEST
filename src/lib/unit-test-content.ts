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
        id: "ff-u1-q1",
        prompt: "The word 'finance' historically derives from a Latin root meaning:",
        options: [
          "Investment and return",
          "Settlement or end of a debt",
          "The study of markets",
          "The management of risk",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u1-q2",
        prompt: "Which of the following BEST captures the central question that all of finance tries to answer?",
        options: [
          "How can companies maximize short-term profits each quarter?",
          "Given scarce money today, where should it be allocated to create the most value over time?",
          "How do we accurately record past financial transactions?",
          "What interest rate should central banks set to control inflation?",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u1-q3",
        prompt: "A financial analyst reviews last year's income statement and uses it to forecast next year's cash flows and recommend whether to invest in a new plant. Which statement correctly describes this situation?",
        options: [
          "The analyst is doing accounting work by reviewing the income statement",
          "The analyst is doing economics work by studying market trends",
          "The analyst is using accounting data (past) as an input to a finance decision (future)",
          "This is neither accounting nor finance — it is operations management",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u1-q4",
        prompt: "You have $8,000 in savings. You choose to invest it in an index fund returning 9% rather than pay off a student loan charging 5% interest. What is the opportunity cost of your investment decision?",
        options: [
          "9% — the return on the index fund",
          "5% — the interest saved by paying off the loan",
          "4% — the difference between the two rates",
          "There is no opportunity cost because both options involve money",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u1-q5",
        prompt: "Which pillar of finance deals with how a company decides between issuing new shares vs. taking on debt to fund a factory expansion?",
        options: [
          "Personal finance — because it affects individual shareholders",
          "Public finance — because the government regulates financial markets",
          "Corporate finance — specifically the capital structure decision",
          "Macroeconomics — because interest rates affect both options",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u1-q6",
        prompt: "A company is highly profitable with excellent products, but it repeatedly fails to collect payments from customers on time and runs short of cash. Which area of corporate finance has it neglected?",
        options: [
          "Capital budgeting",
          "Dividend policy",
          "Working capital management",
          "Mergers and acquisitions",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u1-q7",
        prompt: "Public finance MOST closely studies:",
        options: [
          "How individuals plan for retirement and manage personal debt",
          "How stock exchanges operate and regulate trading",
          "How governments raise revenue, allocate spending, and manage national debt",
          "How multinational corporations hedge foreign currency risk",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u1-q8",
        prompt: "The three pillars of finance — personal, corporate, and public — differ primarily in:",
        options: [
          "The mathematical tools used for calculation",
          "Who is making the financial decision and what goals they are optimizing for",
          "Whether they operate in domestic or international markets",
          "The size of the amounts of money involved",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u1-q9",
        prompt: "$5,000 is invested at 8% per year for 30 years using compound interest. Approximately how much will it be worth? (Use: $5,000 × 1.08^30 ≈ $5,000 × 10.06)",
        options: ["$17,000", "$29,000", "$50,300", "$12,000"],
        correctIndex: 2,
      },
      {
        id: "ff-u1-q10",
        prompt: "A startup founder claims their new app will 'definitely return 200% in one year.' A financially literate investor would FIRST ask:",
        options: [
          "'What is the app's name and marketing strategy?'",
          "'What is the risk level — what are the chances the app returns nothing or loses money?'",
          "'Is 200% higher than 100%?'",
          "'Does the app have a nice user interface?'",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u1-q11",
        prompt: "Which of the following MOST accurately distinguishes finance from accounting?",
        options: [
          "Finance uses computers; accounting uses paper ledgers",
          "Accounting records what happened in the past; finance uses that data to make future decisions",
          "Finance is only relevant to large corporations; accounting applies to all businesses",
          "Accounting measures cash flows; finance measures accounting profits",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u1-q12",
        prompt: "A macroeconomist forecasts that interest rates will rise by 2% next year. A corporate financial manager uses this forecast to increase the discount rate in their capital budgeting model, which causes several proposed projects to show negative NPV. This scenario BEST illustrates:",
        options: [
          "A conflict between economics and finance",
          "How macroeconomic inputs flow directly into finance decision models",
          "Why accounting data is more reliable than economic forecasts",
          "That higher interest rates always make investment worthwhile",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u2-q1",
        prompt: "You will receive 5,000,000 UZS in 3 years. A friend offers to give you 4,000,000 UZS today instead. The bank deposit rate is 10% per year. Which should you choose and why?",
        options: [
          "Take the 4,000,000 today because cash in hand is always better",
          "Take the 4,000,000 today because PV of 5M in 3 years at 10% is only 3,756,574 — less than 4M",
          "Wait for 5,000,000 because it is a larger number",
          "It makes no difference — money has no time value",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u2-q2",
        prompt: "Which of the following CORRECTLY explains why interest exists on loans?",
        options: [
          "Banks invented interest to make profit",
          "Governments require interest to control inflation",
          "Interest compensates lenders for giving up investment opportunities, inflation risk, and uncertainty",
          "Interest is only charged when there is a risk of default",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u2-q3",
        prompt: "Using PV = FV ÷ (1 + r)^n, what is the present value of 12,000,000 UZS to be received in 2 years, at a discount rate of 15%?",
        options: [
          "10,400,000 UZS",
          "9,075,145 UZS",
          "10,000,000 UZS",
          "11,000,000 UZS",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u2-q4",
        prompt: "Two investments both promise to pay 20,000,000 UZS in 5 years. Investment A has a discount rate of 10%. Investment B has a discount rate of 20%. Which has the higher present value?",
        options: [
          "Investment B because 20% is a higher number",
          "They are equal because they both pay 20,000,000",
          "Investment A because lower discount rate means higher PV",
          "Cannot determine without more information",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u2-q5",
        prompt: "You invest 3,000,000 UZS at 12% compound interest per year for 4 years. Approximately what is the future value?",
        options: [
          "4,440,000 UZS",
          "4,716,349 UZS",
          "4,000,000 UZS",
          "5,200,000 UZS",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u2-q6",
        prompt: "A bank offers 12% simple interest or 10% compound interest per year for 5 years. On 1,000,000 UZS, which is better?",
        options: [
          "12% simple interest (1,600,000 UZS) because the rate is higher",
          "10% compound interest (1,610,510 UZS) because compounding produces more",
          "They are exactly equal over 5 years",
          "Simple interest is always better than compound interest",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u2-q7",
        prompt: "You have 8,000,000 UZS. You invest it in stocks expecting 18% per year. The bank offers 14% guaranteed. One year later the stocks returned only 11%. What was your opportunity cost?",
        options: [
          "11% — the actual return you earned",
          "18% — the expected return",
          "14% — the bank deposit you gave up",
          "7% — the difference between expected (18%) and actual (11%)",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u2-q8",
        prompt: "An investment returns 16% per year. Your opportunity cost of capital is 14%. Should you invest?",
        options: [
          "No — 16% is not high enough",
          "Yes — the return exceeds the opportunity cost, so the investment creates value",
          "Only if there is no risk at all",
          "Only if the investment lasts at least 10 years",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u2-q9",
        prompt: "You invest 30,000,000 UZS in a project. The present value of all future cash flows is 26,000,000 UZS. What is the NPV and what should you do?",
        options: [
          "NPV = +26,000,000 — Accept",
          "NPV = −30,000,000 — Reject",
          "NPV = −4,000,000 — Reject, this investment destroys value",
          "NPV = +4,000,000 — Accept",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u2-q10",
        prompt: "A bond pays 10,000,000 UZS per year for 3 years plus 100,000,000 UZS at maturity. Market interest rates suddenly rise sharply. What happens to this bond's price?",
        options: [
          "The bond price rises because higher rates mean more income",
          "The bond price falls because the fixed payments are now discounted at a higher rate, reducing PV",
          "Nothing changes — bonds are not affected by interest rates",
          "The bond price doubles",
        ],
        correctIndex: 1,
      },
      {
        id: "ff-u2-q11",
        prompt: "Which of the following statements about risk and return is CORRECT?",
        options: [
          "It is possible to find genuinely high-return, zero-risk investments if you look hard enough",
          "Lower risk always means higher returns because safe companies are well-managed",
          "Higher expected return always comes with higher risk — there are no exceptions",
          "Risk only matters for large investors, not for individuals",
        ],
        correctIndex: 2,
      },
      {
        id: "ff-u2-q12",
        prompt: "An investor puts 50% in bank deposits, 30% in real estate, and 20% in index funds. This is BEST described as an example of:",
        options: [
          "Speculation",
          "Compound interest",
          "A diversified portfolio structured as an investment pyramid",
          "Opportunity cost calculation",
        ],
        correctIndex: 2,
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

