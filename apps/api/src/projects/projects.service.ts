import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DEFAULT_PAGE_SIZE } from '../common/api-response';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import type { CreateProjectDto } from './dto/create-project.dto';
import type { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService, private readonly activity: ActivityService) {}

  async list(userId: string, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
    const skip = (page - 1) * pageSize;
    const where = { members: { some: { userId } } };
    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({ where, orderBy: { updatedAt: 'desc' }, skip, take: pageSize }),
      this.prisma.project.count({ where }),
    ]);
    const items = await Promise.all(projects.map((project) => this.withProgress(project.id, project)));
    return { items, page, pageSize, total };
  }

  async get(userId: string, id: string) {
    const access = await this.accessibleProject(userId, id);
    return this.withProgress(access.id, access);
  }

  async create(userId: string, dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        ownerId: userId,
        name: dto.name.trim(),
        description: dto.description,
        status: dto.status ?? 'PLANNING',
        priority: dto.priority ?? 'MEDIUM',
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        members: { create: { userId, role: 'OWNER' } },
      },
    });

    await this.activity.create({ userId, action: 'PROJECT_CREATED', entityType: 'PROJECT', entityId: project.id });
    return this.withProgress(project.id, project);
  }

  async update(userId: string, id: string, dto: UpdateProjectDto) {
    await this.accessibleProject(userId, id);
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.deadline !== undefined ? { deadline: dto.deadline ? new Date(dto.deadline) : null } : {}),
      },
    });

    await this.activity.create({ userId, action: 'PROJECT_UPDATED', entityType: 'PROJECT', entityId: id });
    return this.withProgress(project.id, project);
  }

  async remove(userId: string, id: string) {
    await this.accessibleProject(userId, id);
    await this.prisma.project.delete({ where: { id } });
    await this.activity.create({ userId, action: 'PROJECT_DELETED', entityType: 'PROJECT', entityId: id });
    return { deleted: true };
  }

  private async accessibleProject(userId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, members: { some: { userId } } },
    });
    if (!project) throw new NotFoundException('Project not found or access denied');
    return project;
  }

  private async withProgress<T extends { id: string }>(projectId: string, project: T) {
    const [totalTasks, completedTasks] = await this.prisma.$transaction([
      this.prisma.task.count({ where: { projectId } }),
      this.prisma.task.count({ where: { projectId, status: 'COMPLETED' } }),
    ]);
    return {
      ...project,
      progress: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 10000) / 100,
      taskStats: { total: totalTasks, completed: completedTasks },
    };
  }
}
