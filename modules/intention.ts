import { OpenAI } from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { Chat, Intention, intentionSchema, IntentionType } from "@/types";
import { HISTORY_CONTEXT_LENGTH } from "@/app/configuration/chat";
import { INTENTION_PROMPT } from "@/app/configuration/prompts";

/**
 * IntentionModule is responsible for detecting intentions
 */
export class IntentionModule {
  static async detectIntention({
    chat,
    openai,
  }: {
    chat: Chat;
    openai: OpenAI;
  }): Promise<Intention> {
    /**
     * Determine the intention of the user based on the most recent messages
     */
    const mostRecentMessages = chat.messages
      .slice(-HISTORY_CONTEXT_LENGTH)
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

    const response = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: INTENTION_PROMPT() },
        ...mostRecentMessages,
      ],
      response_format: zodResponseFormat(intentionSchema, "intention"),
    });

    if (!response.choices[0].message.parsed) {
      return { type: "random" as IntentionType };
    }
    return response.choices[0].message.parsed;
  }
}
