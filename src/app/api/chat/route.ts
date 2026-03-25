import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { calculateRisk, type RiskInputData } from "@/lib/scoring";

type ChatMode = "finance" | "general" | "analyze";

type AnalysisType = "loan" | "purchase" | "invest";

function parseAnalysisType(raw: unknown): AnalysisType {
  const v = typeof raw === "string" ? raw : "";
  if (v === "loan" || v === "purchase" || v === "invest") return v;
  return "loan";
}

type UnitContext = {
  title?: string;
  focus?: string;
};

const FINANCE_SYSTEM_PROMPT = `You are Zinvest AI, a friendly and knowledgeable financial education assistant for Zinvest — a learning-first finance app.

Your role is to:
- Explain financial concepts clearly and simply, without jargon
- Help users understand topics like cash flow, budgeting, investing, taxes, profit vs. revenue, financial statements, and personal finance
- Use real-world analogies and examples to make concepts stick
- Be encouraging and supportive — many users are beginners
- Keep answers concise but complete (2-4 short paragraphs max unless more detail is requested)
- Occasionally suggest relevant Zinvest learning modules when appropriate

You do NOT give personalized financial advice, recommend specific stocks, or act as a licensed financial advisor. Always clarify this if users ask for specific investment recommendations.

Tone: Warm, clear, confident. Like a smart friend who actually understands finance.`;

const GENERAL_SYSTEM_PROMPT = `You are a general-purpose helpful assistant.

Your job:
- Answer the user's questions clearly and accurately
- If the user's request is ambiguous, ask a quick clarifying question
- When helpful, provide concise structured steps or examples
- If the user asks for professional/financial/legal/medical advice, provide educational information and recommend consulting a qualified professional

Tone: Friendly, direct, and practical.`;

const ANALYZE_SYSTEM_PROMPT = `You are Zinvest AI risk scoring assistant.

You help the user by asking short, specific questions, then producing structured data for risk scoring.

You MUST respond with valid JSON only (no markdown, no extra text).

Two possible response shapes:

1) status = "question" (ask the next question)
{
  "status": "question",
  "question": "string",
  "data": {
    "amount"?: number,
    "income"?: number,
    "contract"?: boolean,
    "relationship"?: "known" | "unknown",
    "deadline"?: number
  }
}

2) status = "scored" (all fields must be present and valid)
{
  "status": "scored",
  "data": {
    "amount": number,
    "income": number,
    "contract": boolean,
    "relationship": "known" | "unknown",
    "deadline": number
  }
}

Rules:
- amount and income must be numbers (not strings).
- deadline must be a number in DAYS. Convert weeks (~*7) and months (~*30) if needed.
- contract is true only if there is a formal contract/agreement.
- relationship is "unknown" if the counterparty is not trusted/known by the user.
- If you don't have enough info, choose status="question" and ask the next missing detail.
- Do not guess ambiguous values; ask follow-ups instead.
`;

function tryParseJsonFromText(raw: string): any | null {
  const text = raw.trim();

  // 1) Direct parse
  try {
    return JSON.parse(text);
  } catch {
    // ignore
  }

  // 2) Strip common markdown wrappers / prefixes.
  // Examples:
  // - json { ... }
  // - ```json { ... } ```
  const stripped = text
    .replace(/^json\s*/i, "")
    .replace(/^```json\s*/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(stripped);
  } catch {
    // ignore
  }

  // 3) Extract first {...} block if model included extra text.
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) {
    const candidate = text.slice(first, last + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // ignore
    }
  }

  return null;
}

function normalizeRiskInput(raw: any): RiskInputData | null {
  const amount = Number(raw?.amount);
  const income = Number(raw?.income);
  const contract = Boolean(raw?.contract);
  const deadline = Number(raw?.deadline);
  const relRaw = typeof raw?.relationship === "string" ? raw.relationship.toLowerCase() : "";
  const relationship: RiskInputData["relationship"] = relRaw === "unknown" ? "unknown" : "known";

  if (!Number.isFinite(amount) || amount < 0) return null;
  if (!Number.isFinite(income) || income < 0) return null;
  if (!Number.isFinite(deadline) || deadline < 0) return null;

  return { amount, income, contract, relationship, deadline };
}

function deriveMissingQuestion(data: any, analysisType: AnalysisType): string {
  const amount = data?.amount;
  const income = data?.income;
  const contract = data?.contract;
  const relationship = data?.relationship;
  const deadline = data?.deadline;

  const amountOk = typeof amount === "number" && Number.isFinite(amount) && amount >= 0;
  const incomeOk = typeof income === "number" && Number.isFinite(income) && income >= 0;
  const contractOk = typeof contract === "boolean";
  const relationshipOk =
    relationship === "known" || relationship === "unknown" || typeof relationship === "string";
  const deadlineOk = typeof deadline === "number" && Number.isFinite(deadline) && deadline >= 0;

  // Keep order aligned with our scoring input.
  if (!amountOk) return "What is the total amount (in dollars) for this decision?";
  if (!incomeOk) return "What is the borrower's monthly income (in dollars)?";
  if (!contractOk) return `Is there a formal written contract or agreement for this ${analysisType}?`;
  if (!relationshipOk) {
    return "Is the counterparty someone you know/trust? Reply with known or unknown.";
  }
  if (!deadlineOk) {
    return "What is the repayment/deadline time in days?";
  }

  return "Please provide the missing details.";
}

function buildSystemPrompt(base: string, unit?: UnitContext, mode?: ChatMode) {
  const unitTitle = unit?.title?.trim();
  const unitFocus = unit?.focus?.trim();

  if (!unitTitle && !unitFocus) return base;

  const unitBlock = [
    "Unit/topic context (adapt your answer to this):",
    unitTitle ? `- Title: ${unitTitle}` : null,
    unitFocus ? `- Focus: ${unitFocus}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const modeBlock =
    mode === "general"
      ? ""
      : "\n\nIf helpful, connect the explanation to the learning unit and keep it education-first.";

  return `${base}\n\n${unitBlock}${modeBlock}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, mode, unit, analysisType, userId } = body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      mode?: ChatMode;
      unit?: UnitContext;
      analysisType?: AnalysisType;
      userId?: string | null;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    // Some hosting panels store env values with quotes/spaces.
    const rawApiKey = process.env.ANTHROPIC_API_KEY;
    const apiKey =
      rawApiKey?.trim().replace(/^['"]/, "").replace(/['"]$/, "") ?? "";
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const resolvedMode: ChatMode =
      mode === "general" ? "general" : mode === "analyze" ? "analyze" : "finance";

    const systemPrompt =
      resolvedMode === "analyze"
        ? `${ANALYZE_SYSTEM_PROMPT}\n\nScenario type: ${parseAnalysisType(analysisType)}.`
        : buildSystemPrompt(
            resolvedMode === "general" ? GENERAL_SYSTEM_PROMPT : FINANCE_SYSTEM_PROMPT,
            unit,
            resolvedMode
          );

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData?.error?.message || `Upstream error ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.content?.map((b: { text?: string }) => b.text || "").join("") || "";

    if (resolvedMode !== "analyze") {
      return NextResponse.json({ text });
    }

    // Analyze flow: we expect strict JSON from the model.
    let parsed: any = null;
    try {
      parsed = text ? tryParseJsonFromText(text) : null;
    } catch {
      // If the model didn't follow JSON-only instructions, fallback to plain text.
      return NextResponse.json({ text });
    }

    const status = parsed?.status;
    if (status === "question") {
      const question = typeof parsed?.question === "string" && parsed.question.trim().length > 0
        ? parsed.question
        : deriveMissingQuestion(parsed?.data, parseAnalysisType(analysisType));
      return NextResponse.json({ text: question });
    }

    if (status === "scored") {
      const normalized = normalizeRiskInput(parsed?.data);
      if (!normalized) {
        // If the model jumped to "scored" but didn't provide all fields, recover gracefully by asking.
        const nextQ = deriveMissingQuestion(parsed?.data, parseAnalysisType(analysisType));
        return NextResponse.json({ text: nextQ });
      }

      const scoring = calculateRisk(normalized);
      const out = {
        risk: scoring.score,
        verdict: scoring.verdict,
        confidence: scoring.confidence,
        reasons: scoring.reasons,
      };

      // Persist analysis result (best-effort).
      try {
        const supabase = getSupabase();
        if (supabase) {
          await supabase.from("analyses").insert({
            user_id: typeof userId === "string" ? userId : null,
            type: parseAnalysisType(analysisType),
            input_data: normalized,
            result: out,
          });
        }
      } catch (e) {
        console.error("Analyze persist error:", e);
      }

      return NextResponse.json(out);
    }

    // Unknown response shape: be forgiving.
    if (parsed?.question && typeof parsed.question === "string") {
      return NextResponse.json({ text: parsed.question });
    }
    return NextResponse.json({ text: "Please provide the missing details." });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
