import type { EntityId, IsoDateTime } from "./common.js";
import type { CreateCalendarEventInput } from "./event.js";
import type { CreateReminderInput } from "./reminder.js";
import type { CreateTaskInput } from "./task.js";

/**
 * Backend-only provider abstraction (apps/api/src/modules/ai).
 * Concrete providers (OpenAI, Anthropic, Google, OpenAI-compatible, local)
 * implement this interface. No module outside apps/api's AI module may
 * depend on a specific vendor SDK (§21).
 */
export interface AIProvider {
  readonly id: string;
  generateText(input: AIGenerateTextInput): Promise<AIResponse>;
  summarize(input: AISummarizeInput): Promise<AIResponse>;
  classify(input: AIClassifyInput): Promise<AIResponse>;
}

export interface AIGenerateTextInput {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AISummarizeInput {
  text: string;
  maxSentences?: number;
}

export interface AIClassifyInput {
  text: string;
  labels: string[];
}

export interface AIResponse {
  text: string;
  provider: string;
  model: string;
  usage?: { inputTokens: number; outputTokens: number };
}

/** POST /api/ai/chat request/response (see docs/API_CONTRACT.md). */
export interface AIChatRequest {
  message: string;
  conversationId?: EntityId;
}

export interface AIChatResponse {
  conversationId: EntityId;
  reply: string;
  /** Structured action AI proposed from the message, if any (§23). Requires
   * explicit user confirmation via AIConfirmActionRequest before it is applied. */
  proposedAction: AIProposedAction | null;
}

export type AIProposedAction =
  | { type: "create_task"; input: CreateTaskInput }
  | { type: "create_calendar_event"; input: CreateCalendarEventInput }
  | { type: "create_reminder"; input: CreateReminderInput };

/** POST /api/ai/actions/confirm — required before any AIProposedAction is persisted. */
export interface AIConfirmActionRequest {
  action: AIProposedAction;
  confirmed: boolean;
}

export interface AISummarizeRequest {
  entityType: "note" | "message" | "email_message";
  entityId: EntityId;
}

export interface DailyBriefingGenerateRequest {
  date?: IsoDateTime;
  useAI?: boolean;
}
