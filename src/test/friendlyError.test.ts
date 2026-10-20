import { describe, it, expect } from 'vitest';
import { friendlyError } from '@/lib/friendlyError';

describe('friendlyError', () => {
  it('maps wrong credentials', () => {
    expect(friendlyError(new Error('Invalid login credentials'))).toBe('E-mail ou senha incorretos.');
  });
  it('never leaks database details', () => {
    expect(friendlyError(new Error('duplicate key value violates unique constraint "profiles_slug_key"'))).toBe('Ocorreu um erro. Tente novamente.');
  });
});
