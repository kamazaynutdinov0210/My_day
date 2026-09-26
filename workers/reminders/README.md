# workers/reminders — Owned by AI #4 (Workers / Background System)
Not implemented in Phase 1. BullMQ queue + processor for the "reminders" domain.
Must survive process restart (jobs are persisted in Redis via BullMQ, not in-memory).
