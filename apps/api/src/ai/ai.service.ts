import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { CalendarService } from '../calendar/calendar.service';
import { RemindersService } from '../reminders/reminders.service';
import { AiProviderService } from './ai-provider.service';
import type { AIChatRequest, AIChatResponse, AIConfirmActionRequest, AIResponse, AISummarizeRequest, AIProposedAction } from '@my-day/types';

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasks: TasksService,
    private readonly calendar: CalendarService,
    private readonly reminders: RemindersService,
    private readonly provider: AiProviderService,
  ) {}

  async chat(userId: string, input: AIChatRequest): Promise<AIChatResponse> {
    const message = input.message.trim();
    const conversationId = input.conversationId ?? randomBytes(12).toString('hex');

    let proposedAction: AIProposedAction | null = null;
    const lower = message.toLowerCase();
    if (lower.includes('task') || lower.includes('задач')) {
      proposedAction = {
        type: 'create_task',
        input: { title: message, priority: 'MEDIUM', status: 'TODO' } as never,
      };
    } else if (lower.includes('meeting') || lower.includes('встреч') || lower.includes('event')) {
      const start = new Date(Date.now() + 3600_000).toISOString();
      const end = new Date(Date.now() + 7200_000).toISOString();
      proposedAction = {
        type: 'create_calendar_event',
        input: { title: message, startAt: start, endAt: end } as never,
      };
    } else if (lower.includes('remind') || lower.includes('напомн')) {
      proposedAction = {
        type: 'create_reminder',
        input: { title: message, remindAt: new Date(Date.now() + 3600_000).toISOString() } as never,
      };
    }

    const reply = proposedAction
      ? 'I prepared a proposed action. Please confirm to apply it.'
      : 'I can help create tasks, calendar events, or reminders. Try: "Create task: buy milk".';

    return { conversationId, reply, proposedAction };
  }

  async confirm(userId: string, input: AIConfirmActionRequest) {
    if (!input.confirmed) {
      return null;
    }
    const action = input.action;
    if (action.type === 'create_task') {
      return this.tasks.create(userId, action.input as never);
    }
    if (action.type === 'create_calendar_event') {
      return this.calendar.create(userId, action.input as never);
    }
    if (action.type === 'create_reminder') {
      return this.reminders.create(userId, action.input as never);
    }
    return null;
  }

  async summarize(userId: string, input: AISummarizeRequest): Promise<AIResponse> {
    let text = '';
    if (input.entityType === 'note') {
      const note = await this.prisma.note.findFirst({ where: { id: input.entityId, userId } });
      text = note?.content ?? '';
    } else if (input.entityType === 'message') {
      const msg = await this.prisma.message.findFirst({ where: { id: input.entityId, userId } });
      text = msg?.body ?? '';
    } else if (input.entityType === 'email_message') {
      const email = await this.prisma.emailMessage.findFirst({ where: { id: input.entityId, userId } });
      text = email?.bodyPreview ?? '';
    }
    const response = await this.provider.generateText({
      prompt: `Summarize the following ${input.entityType} in 3 sentences: ${text}`,
      maxTokens: 256,
    });
    return {
      text: response.text || (text.length > 300 ? `${text.slice(0, 300)}…` : text) || 'No content to summarize.',
      provider: response.provider,
      model: response.model,
      usage: response.usage,
    };
  }
}