import OpenAI from "openai";
import { AUDIT_JSON_SCHEMA, AUDIT_MAX_OUTPUT_TOKENS } from "./prompt";

const DEFAULT_MODEL = "gpt-5.6-terra";

export interface AuditGeneration {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
  refused: boolean;
  truncated: boolean;
}

let client: OpenAI | null = null;

function openai(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

    client = new OpenAI({ apiKey, maxRetries: 2, timeout: 25_000 });
  }

  return client;
}

export async function generateAudit(
  system: string,
  user: string,
  safetyIdentifier: string,
): Promise<AuditGeneration> {
  const response = await openai().responses.create({
    model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
    instructions: system,
    input: user,
    max_output_tokens: AUDIT_MAX_OUTPUT_TOKENS,
    safety_identifier: safetyIdentifier,
    store: false,
    text: {
      format: {
        type: "json_schema",
        name: "gamma_audit",
        strict: true,
        schema: AUDIT_JSON_SCHEMA,
      },
    },
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  const refused = response.output.some(
    (item) =>
      item.type === "message" &&
      item.content.some((content) => content.type === "refusal"),
  );

  return {
    text: response.output_text,
    inputTokens: response.usage?.input_tokens,
    outputTokens: response.usage?.output_tokens,
    refused:
      refused || response.incomplete_details?.reason === "content_filter",
    truncated:
      response.incomplete_details?.reason === "max_output_tokens" ||
      response.status === "incomplete",
  };
}
