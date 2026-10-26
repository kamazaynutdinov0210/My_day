import type { TransformFnParams } from 'class-transformer';

/** Repeated query keys (?status=A&status=B) arrive as an array, a single one as a string. */
export function toArray({ value }: TransformFnParams): unknown {
  if (value === undefined || value === null || value === '') return undefined;
  return Array.isArray(value) ? value : [value];
}
