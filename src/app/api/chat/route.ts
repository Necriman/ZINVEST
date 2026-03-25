import { NextRequest, NextResponse } from "next/server";

type ChatMode = "finance" | "general";

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
    const { messages, mode, unit } = body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      mode?: ChatMode;
      unit?: UnitContext;
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

    const resolvedMode: ChatMode = mode === "general" ? "general" : "finance";
    const baseSystemPrompt =
      resolvedMode === "general" ? GENERAL_SYSTEM_PROMPT : FINANCE_SYSTEM_PROMPT;
    const systemPrompt = buildSystemPrompt(baseSystemPrompt, unit, resolvedMode);

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

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
