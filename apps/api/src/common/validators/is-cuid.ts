import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, type ValidationOptions } from 'class-validator';

// Prisma ids are cuids (see prisma/schema.prisma), not UUIDs.
const CUID_PATTERN = /^c[a-z0-9]{20,31}$/;

export function IsCuid(options?: ValidationOptions) {
  return applyDecorators(IsString(options), Matches(CUID_PATTERN, options));
}
