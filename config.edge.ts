import type { AppConfig } from "./lib/edge/types.ts";

import { prompt } from "./prompts/sales-agent.ts";

export const appConfig: AppConfig = {
  // This should be set in an environment variable
  // See https://platform.openai.com/account/api-keys
  OPENAI_API_KEY: Netlify.env.get("OPENAI_API_KEY") ?? "",

  // The maximum number of message in the history to send to the API
  // You should also set this in the config.browser.ts file.
  historyLength: 8,

  // The maximum length in characters of each message sent to the API
  // You should also set this in the config.browser.ts file.
  maxMessageLength: 600,

  // The config values sent to the OpenAI API
  // See https://platform.openai.com/docs/api-reference/chat/create
  apiConfig: {
    model: "gpt-4o-mini",
  },

  // This is where the magic happens. See the README for details
  // This can be a plain string if you'd prefer, or you can use
  // information from the request or context to generate it.
  systemPrompt: (_req, context) => `${prompt}
Current date: ${new Date().toDateString()}.
User location: ${context.geo.city}, ${context.geo.country}`,
};
