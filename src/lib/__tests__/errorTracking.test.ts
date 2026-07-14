import { describe, expect, it } from 'vitest';
import { sanitizeLogContext, sanitizeLogString } from '../errorTracking';

describe('log redaction', () => {
  it('removes common credentials, paths, contacts, and record identifiers', () => {
    const input = [
      'Bearer github_pat_secret_value',
      'C:\\Users\\Alice\\Documents\\client.txt',
      'alice@example.com',
      '(555) 123-4567',
      '550e8400-e29b-41d4-a716-446655440000',
    ].join(' ');

    const result = sanitizeLogString(input);

    expect(result).not.toContain('github_pat_secret_value');
    expect(result).not.toContain('Alice');
    expect(result).not.toContain('alice@example.com');
    expect(result).not.toContain('555');
    expect(result).not.toContain('550e8400');
    expect(result).toContain('[redacted credential]');
    expect(result).toContain('[redacted filesystem path]');
  });

  it('drops sensitive context fields while retaining bounded operational metadata', () => {
    const context = sanitizeLogContext({
      eventId: 'RB-DOC-004',
      durationMs: 42,
      variables: { clientName: 'Example Person' },
      filePath: 'C:\\Users\\Alice\\secret.pdf',
      nested: { status: 'rolled-back', email: 'alice@example.com' },
    });

    expect(context).toEqual({
      eventId: 'RB-DOC-004',
      durationMs: 42,
      variables: '[redacted]',
      filePath: '[redacted]',
      nested: { status: 'rolled-back', email: '[redacted]' },
    });
  });

  it('bounds very long strings', () => {
    expect(sanitizeLogString('x'.repeat(2000))).toMatch(/\[truncated\]$/);
  });
});
