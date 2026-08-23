import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateSaleInput } from '@/types';

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  query: vi.fn(),
  execute: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }));
vi.mock('../connection', () => ({ query: mocks.query, execute: mocks.execute }));
vi.mock('../dogs', () => ({ getDog: vi.fn() }));

import {
  createSale,
  createSaleFromInterest,
  deleteSale,
  updateSale,
} from '../sales';

const saleRow = {
  id: 'sale-1',
  client_id: 'client-1',
  sale_date: '2026-08-22T12:00:00.000Z',
  price: 1_200,
  deposit_amount: 200,
  deposit_date: null,
  contract_path: null,
  shipped_date: null,
  received_date: null,
  is_local_pickup: 1,
  payment_status: 'deposit_only',
  warranty_info: null,
  registration_transfer_date: null,
  transport_id: null,
  notes: null,
  created_at: '2026-08-22T12:00:00.000Z',
  updated_at: '2026-08-22T12:00:00.000Z',
};

const puppyRow = {
  id: 'junction-1',
  sale_id: 'sale-1',
  dog_id: 'dog-1',
  price: 1_200,
  created_at: '2026-08-22T12:00:00.000Z',
};

const clientRow = {
  id: 'client-1',
  name: 'Test Client',
  phone: null,
  email: null,
  address_line1: null,
  address_line2: null,
  city: null,
  state: null,
  postal_code: null,
  notes: null,
  created_at: '2026-08-22T12:00:00.000Z',
  updated_at: '2026-08-22T12:00:00.000Z',
};

const input: CreateSaleInput = {
  clientId: 'client-1',
  saleDate: new Date('2026-08-22T12:00:00.000Z'),
  price: 1_200,
  depositAmount: 200,
  isLocalPickup: true,
  paymentStatus: 'deposit_only',
  puppies: [{ dogId: 'dog-1', price: 1_200 }],
};

describe('native sale workflow boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.invoke.mockResolvedValue('sale-1');
    mocks.query.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM sales WHERE id')) return [saleRow];
      if (sql.includes('FROM sale_puppies')) return [puppyRow];
      if (sql.includes('FROM clients WHERE id')) return [clientRow];
      return [];
    });
  });

  it('creates a sale through the atomic command and returns its assignments', async () => {
    const sale = await createSale(input);

    expect(mocks.invoke).toHaveBeenCalledWith('create_sale_atomic', {
      request: expect.objectContaining({
        clientId: 'client-1',
        saleDate: '2026-08-22T12:00:00.000Z',
        price: 1_200,
        puppies: [{ dogId: 'dog-1', price: 1_200 }],
      }),
    });
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(sale.puppies).toHaveLength(1);
  });

  it('sends a complete merged sale to the atomic update command', async () => {
    const sale = await updateSale('sale-1', {
      notes: 'Updated safely',
      puppies: [{ dogId: 'dog-1', price: 1_300 }],
    });

    expect(mocks.invoke).toHaveBeenCalledWith('update_sale_atomic', {
      saleId: 'sale-1',
      request: expect.objectContaining({
        clientId: 'client-1',
        price: 1_300,
        notes: 'Updated safely',
        puppies: [{ dogId: 'dog-1', price: 1_300 }],
      }),
    });
    expect(sale?.puppies).toHaveLength(1);
  });

  it('converts an interest in the same atomic command as sale creation', async () => {
    await createSaleFromInterest('interest-1', input);

    expect(mocks.invoke).toHaveBeenCalledWith('convert_interest_to_sale_atomic', {
      interestId: 'interest-1',
      request: expect.objectContaining({ puppies: input.puppies }),
    });
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it('deletes through the atomic status-restoring workflow', async () => {
    mocks.invoke.mockResolvedValueOnce(true);

    await expect(deleteSale('sale-1')).resolves.toBe(true);
    expect(mocks.invoke).toHaveBeenCalledWith('delete_sale_atomic', { saleId: 'sale-1' });
  });
});
