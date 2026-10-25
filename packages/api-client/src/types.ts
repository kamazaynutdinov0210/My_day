import type {
  CalendarEvent, EmailMessage, Message, Note, Project, Task,
} from "@my-day/types";

// TODO(Architect AI): these response shapes are defined inline in docs/API_CONTRACT.md
// but have no type in packages/types. Move them there (see apps/web/CONTRACT_REQUESTS.md).
export interface SearchResults {
  tasks: Task[];
  projects: Project[];
  events: CalendarEvent[];
  notes: Note[];
  messages: Message[];
  emails: EmailMessage[];
}
export interface UnreadCount { count: number }
export interface HealthStatus { status: "ok"; db: "ok" | "error"; redis: "ok" | "error" }
