import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  execute: vi.fn(),
}));

vi.mock('../connection', () => ({ query: mocks.query, execute: mocks.execute }));

import {
  createHealthScheduleTemplate,
  updateHealthScheduleTemplate,
} from '../health';

const templateRow = {
  id: 'template-1',
  name: 'Default Schedule',
  is_default: 1,
  items: '[]',
  created_at: '2026-08-22T12:00:00.000Z',
  updated_at: '2026-08-22T12:00:00.000Z',
};

describe('health schedule mutation boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.execute.mockResolvedValue({ rowsAffected: 1, lastInsertId: null });
    mocks.query.mockResolvedValue([templateRow]);
  });

  it('uses a parameterized predicate when creating a new default template', async () => {
    await createHealthScheduleTemplate({
      name: 'Default Schedule',
      isDefault: true,
      items: [],
    });

    expect(mocks.execute).toHaveBeenNthCalledWith(
      1,
      'UPDATE health_schedule_templates SET is_default = ? WHERE is_default <> ?',
      [0, 0],
    );
  });

  it('uses a parameterized predicate when changing the default template', async () => {
    await updateHealthScheduleTemplate('template-1', { isDefault: true });

    expect(mocks.execute).toHaveBeenNthCalledWith(
      1,
      'UPDATE health_schedule_templates SET is_default = ? WHERE is_default <> ?',
      [0, 0],
    );
  });
});
