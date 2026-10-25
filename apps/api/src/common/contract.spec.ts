import { HttpException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { IsString, Length, validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { paginated, parsePaging } from './api-response';
import { buildErrorBody } from './filters/http-exception.filter';
import { flattenValidationErrors, validationExceptionFactory } from './validation';

class SampleDto {
  @IsString() @Length(1, 10) title!: string;
}

describe('pagination helpers (API_CONTRACT.md sections 1-2)', () => {
  it('uses defaults and clamps bad input', () => {
    expect(parsePaging()).toEqual({ page: 1, pageSize: 20 });
    expect(parsePaging('3', '500')).toEqual({ page: 3, pageSize: 100 });
    expect(parsePaging('abc', '-4')).toEqual({ page: 1, pageSize: 20 });
  });

  it('puts the array in data and the counts in meta.pagination', () => {
    expect(paginated(['a', 'b'], 2, 2, 5)).toEqual({
      success: true,
      data: ['a', 'b'],
      meta: { pagination: { page: 2, pageSize: 2, totalItems: 5, totalPages: 3 } },
    });
    expect(paginated([], 1, 20, 0).meta.pagination.totalPages).toBe(1);
  });
});

describe('error envelope', () => {
  it('turns class-validator errors into VALIDATION_ERROR with field details', () => {
    const errors = validateSync(plainToInstance(SampleDto, {}));
    const body = buildErrorBody(400, validationExceptionFactory(errors).getResponse());
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details?.[0]).toMatchObject({ field: 'title' });
    expect(flattenValidationErrors(errors).length).toBeGreaterThan(0);
  });

  it('maps statuses to contract codes', () => {
    expect(buildErrorBody(401, new HttpException('nope', 401).getResponse()).error.code).toBe('UNAUTHORIZED');
    expect(buildErrorBody(403, new HttpException('no', 403).getResponse()).error.code).toBe('FORBIDDEN');
    expect(buildErrorBody(404, new HttpException('gone', 404).getResponse()).error.code).toBe('NOT_FOUND');
    expect(buildErrorBody(429, undefined).error.code).toBe('RATE_LIMITED');
  });

  it('never leaks internal error text on 500', () => {
    const body = buildErrorBody(500, undefined);
    expect(body.error).toEqual({ code: 'INTERNAL_ERROR', message: 'Internal server error' });
  });
});
