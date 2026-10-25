import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from '@nestjs/common';

export interface ValidationDetail {
  field: string;
  message: string;
}

export function flattenValidationErrors(errors: ValidationError[], parent = ''): ValidationDetail[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = Object.values(error.constraints ?? {}).map((message) => ({ field, message }));
    return [...own, ...flattenValidationErrors(error.children ?? [], field)];
  });
}

/** Produces the VALIDATION_ERROR envelope from API_CONTRACT.md section 1. */
export function validationExceptionFactory(errors: ValidationError[]) {
  return new BadRequestException({
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details: flattenValidationErrors(errors),
  });
}
