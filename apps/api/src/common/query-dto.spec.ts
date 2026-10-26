import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { ListTasksQuery } from '../tasks/dto/list-tasks.query';

const parse = (query: Record<string, unknown>) => {
  const dto = plainToInstance(ListTasksQuery, query);
  return { dto, errors: validateSync(dto, { whitelist: true, forbidNonWhitelisted: true }) };
};

describe('ListTasksQuery (query string -> filters)', () => {
  it('turns repeated keys and single values into arrays, as the web client sends them', () => {
    const { dto, errors } = parse({ status: ['TODO', 'IN_PROGRESS'], priority: 'HIGH', pageSize: '8' });
    expect(errors).toHaveLength(0);
    expect(dto.status).toEqual(['TODO', 'IN_PROGRESS']);
    expect(dto.priority).toEqual(['HIGH']);
    expect(dto.pageSize).toBe(8);
  });

  it('rejects unknown statuses, bad dates and unknown parameters', () => {
    expect(parse({ status: 'NOPE' }).errors.length).toBeGreaterThan(0);
    expect(parse({ dueBefore: 'yesterday' }).errors.length).toBeGreaterThan(0);
    expect(parse({ hacker: '1' }).errors.length).toBeGreaterThan(0);
  });
});
