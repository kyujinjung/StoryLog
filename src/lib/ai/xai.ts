import OpenAI from "openai";

export function hasXaiApiKey() {
  return Boolean(process.env.XAI_API_KEY?.trim());
}

export function getXaiModel() {
  return process.env.XAI_MODEL?.trim() || "grok-4.5";
}

export function createXaiClient() {
  const apiKey = process.env.XAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("XAI_API_KEY is not configured.");
  }

  return new OpenAI({
    apiKey,
    baseURL: "https://api.x.ai/v1",
    timeout: 120_000
  });
}
