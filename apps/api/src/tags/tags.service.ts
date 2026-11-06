import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTagDto } from './dto/create-tag.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.tag.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async create(userId: string, dto: CreateTagDto) {
    const name = dto.name.trim();
    const existing = await this.prisma.tag.findUnique({
      where: { userId_name: { userId, name } },
    });
    if (existing) throw new ConflictException('Tag already exists');
    return this.prisma.tag.create({
      data: { userId, name, color: dto.color?.trim() || null },
    });
  }

  async remove(userId: string, id: string) {
    const tag = await this.prisma.tag.findFirst({ where: { id, userId } });
    if (!tag) throw new NotFoundException('Tag not found');
    await this.prisma.tag.delete({ where: { id } });
    return null;
  }
}