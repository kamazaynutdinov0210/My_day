import { Injectable } from '@nestjs/common';
import type { ActivityAction, EntityType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: {
    userId: string;
    action: ActivityAction;
    entityType: EntityType;
    entityId: string;
    metadata?: Prisma.InputJsonObject;
  }) {
    return this.prisma.activityLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata,
      },
    });
  }
}
