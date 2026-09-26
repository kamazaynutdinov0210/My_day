# AI Contract

Status: **Phase 1 baseline**. Implemented by AI #7 (AI Assistant) against
`packages/types/src/ai.ts`.

## 1. Provider abstraction

```
interface AIProvider {
  generateText(input: AIGenerateTextInput): Promise<AIResponse>;
  summarize(input: AISummarizeInput): Promise<AIResponse>;
  classify(input: AIClassifyInput): Promise<AIResponse>;
}
```

Concrete implementations: OpenAI, Anthropic, Google, any OpenAI-compatible
endpoint, and a local-model adapter — selected via `AI_DEFAULT_PROVIDER`
in `.env.example`, with per-provider credentials also read from env. No
module outside `apps/api/src/modules/integrations/ai/` imports a vendor
SDK directly; everything else in the app depends only on `AIProvider`.

## 2. Access boundary

The AI layer **never** has direct, unmediated access to PostgreSQL (§22 of
the brief). It reads/writes only through backend services — the same
`TasksService`, `ProjectsService`, `CalendarService`, etc. that the REST
controllers use — so every AI-initiated change is validated, logged
(`ActivityLog`), and subject to the same authorization checks as a normal
user request.

## 3. Capabilities in scope

Per §22 of the brief: natural-language task creation, reminder creation,
calendar event creation, email/message summarization, morning briefing
generation, task decomposition, project planning assistance, note
summarization, knowledge search (future: semantic), productivity
analysis, and schedule suggestions. All are implemented as backend
"tools" the AI module can invoke — not as free-form database access.

## 4. Natural language commands

Flow for `POST /api/ai/chat` (`AIChatRequest` → `AIChatResponse`,
`packages/types/src/ai.ts`):

```
User: "Завтра в 14:00 встреча с Иваном на один час."
  → AI module parses intent
  → returns AIChatResponse.proposedAction =
      { type: "create_calendar_event", input: CreateCalendarEventInput }
```

```
User: "Напомни мне завтра утром проверить почту."
  → proposedAction =
      { type: "create_reminder", input: CreateReminderInput }
```

`AIProposedAction` is a discriminated union over `create_task`,
`create_calendar_event`, `create_reminder` (extensible — new variants are
an additive contract change, not a breaking one, as long as existing
variants are untouched).

## 5. Confirmation requirement

Any AI-proposed action that would create or modify user data is **never**
applied automatically. The client must call
`POST /api/ai/actions/confirm` with `{ action, confirmed: true }`
(`AIConfirmActionRequest`) before the backend persists it, satisfying
§23 of the brief ("для действий, которые изменяют важные пользовательские
данные, предусмотреть механизм подтверждения"). A `confirmed: false` (or
omitted) request is a no-op that returns success without side effects.

## 6. Summarization

`POST /api/ai/summarize` (`AISummarizeRequest`) accepts a reference to an
existing `note`, `message`, or `email_message` (by `entityType` +
`entityId`) — the AI module loads the entity via the owning service, not
via a client-supplied raw text blob, so summarization always respects the
same authorization checks as reading the entity directly.

## 7. Morning briefing

`briefing.morning` (see `docs/EVENTS.md`) generates a `DailyBriefing` from
real `Task`/`CalendarEvent`/`TimeEntry` data. `DailyBriefing.generatedBy`
is `"template"` by default (deterministic string formatting, per the
example in §16 of the brief) or `"ai"` when
`DailyBriefingGenerateRequest.useAI` is set, in which case the same
underlying stats (`DailyBriefingStats`) are passed to `AIProvider.summarize`
or `generateText` to produce more natural phrasing — the AI never invents
figures that aren't in `DailyBriefingStats`.

## 8. Structured outputs

Any AI call that must return machine-usable data (a `CreateTaskInput`, a
classification label, etc.) is prompted to return JSON only, validated
against the corresponding `packages/types` interface before use, and
rejected/retried if it fails validation — never passed through unchecked
into a database write.

## 9. Extensibility

Knowledge search (§13, §26 of the brief) is designed to grow into semantic
search/embeddings without a core `Note` schema change — a future
`NoteEmbedding` model referencing `Note.id` is an additive
`docs/ARCHITECTURE.md` §"Changing the contract" change, not a Phase 1
deliverable.
