import { Injectable, NotFoundException } from '@nestjs/common';
import { DEFAULT_PAGE_SIZE } from '../common/api-response';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import type { CreateNoteDto } from './dto/create-note.dto';
import type { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService, private readonly activity: ActivityService) {}

  async list(userId: string, search?: string, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
    const skip = (page - 1) * pageSize;
    const where = {
      userId,
      ...(search
        ? { OR: [{ title: { contains: search, mode: 'insensitive' as const } }, { content: { contains: search, mode: 'insensitive' as const } }] }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.note.findMany({ where, orderBy: { updatedAt: 'desc' }, skip, take: pageSize }),
      this.prisma.note.count({ where }),
    ]);
    return { items, page, pageSize, total };
  }

  async get(userId: string, id: string) {
    const note = await this.prisma.note.findFirst({ where: { id, userId } });
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  async create(userId: string, dto: CreateNoteDto) {
    const note = await this.prisma.note.create({
      data: {
        userId,
        title: dto.title.trim(),
        content: dto.content,
        type: dto.type,
        projectId: dto.projectId,
        taskId: dto.taskId,
        eventId: dto.eventId,
      },
    });
    await this.activity.create({ userId, action: 'NOTE_CREATED', entityType: 'NOTE', entityId: note.id });
    return note;
  }

  async update(userId: string, id: string, dto: UpdateNoteDto) {
    await this.get(userId, id);
    const note = await this.prisma.note.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.projectId !== undefined ? { projectId: dto.projectId } : {}),
        ...(dto.taskId !== undefined ? { taskId: dto.taskId } : {}),
        ...(dto.eventId !== undefined ? { eventId: dto.eventId } : {}),
      },
    });
    await this.activity.create({ userId, action: 'NOTE_UPDATED', entityType: 'NOTE', entityId: id });
    return note;
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.prisma.note.delete({ where: { id } });
    await this.activity.create({ userId, action: 'NOTE_DELETED', entityType: 'NOTE', entityId: id });
    return { deleted: true };
  }
}
