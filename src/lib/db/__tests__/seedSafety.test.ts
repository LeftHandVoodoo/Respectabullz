import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryMock, executeMock, invokeMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  executeMock: vi.fn(),
  invokeMock: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: invokeMock,
}));

vi.mock('../connection', () => ({
  query: queryMock,
  execute: executeMock,
}));

import { seedDatabase } from '../legacy';

describe('development sample-data containment', () => {
  beforeEach(() => {
    queryMock.mockReset();
    executeMock.mockReset();
    invokeMock.mockReset();
    executeMock.mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });
    invokeMock.mockResolvedValue({ statementsApplied: 1, foreignKeysVerified: true });
  });

  it('refuses to seed over any existing application records', async () => {
    queryMock
      .mockResolvedValueOnce([{ name: 'dogs' }])
      .mockResolvedValueOnce([{ count: 1 }]);

    await expect(seedDatabase()).rejects.toThrow(
      'Development sample data requires no user-created records'
    );
    expect(executeMock).not.toHaveBeenCalled();
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('rejects an unexpected table identifier before constructing a count query', async () => {
    queryMock.mockResolvedValueOnce([{ name: 'dogs; DROP TABLE dogs' }]);

    await expect(seedDatabase()).rejects.toThrow(
      'Refusing to inspect unexpected table name'
    );
    expect(queryMock).toHaveBeenCalledTimes(1);
    expect(executeMock).not.toHaveBeenCalled();
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('commits a complete fixture and preserves the transport column mapping', async () => {
    queryMock.mockResolvedValueOnce([]);

    await seedDatabase();

    expect(executeMock).not.toHaveBeenCalled();
    expect(invokeMock).toHaveBeenCalledTimes(1);
    const statements = invokeMock.mock.calls[0]?.[1]?.statements as Array<{
      sql: string;
      params: unknown[];
    }>;
    const flightTransport = statements.find(
      ({ sql, params }) =>
        typeof sql === 'string' &&
        sql.includes('INSERT INTO transports') &&
        Array.isArray(params) &&
        params.includes('DEMO-TRANSIT-1234')
    );

    expect(flightTransport?.params).toHaveLength(18);
    expect(flightTransport?.params[11]).toBe('TX');
    expect(flightTransport?.params[12]).toBe('DEMO-TRANSIT-1234');
  });
});
