import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BreederSettings, Client, Dog, Sale } from '@/types';

const mocks = vi.hoisted(() => ({
  getDogs: vi.fn(),
  getDogPhotos: vi.fn(),
  getVaccinations: vi.fn(),
  getMedicalRecords: vi.fn(),
  getWeightEntries: vi.fn(),
  getGeneticTests: vi.fn(),
  getHealthScheduleTemplate: vi.fn(),
  createPuppyHealthTask: vi.fn(),
  getSale: vi.fn(),
  getClient: vi.fn(),
  getExpenses: vi.fn(),
  getBreederSettings: vi.fn(),
  query: vi.fn(),
  getHeatCycles: vi.fn(),
  getLitters: vi.fn(),
  getLitter: vi.fn(),
}));

vi.mock('../dogs', () => ({
  getDogs: mocks.getDogs,
  getDogPhotos: mocks.getDogPhotos,
}));

vi.mock('../health', () => ({
  getVaccinations: mocks.getVaccinations,
  getMedicalRecords: mocks.getMedicalRecords,
  getWeightEntries: mocks.getWeightEntries,
  getGeneticTests: mocks.getGeneticTests,
  getHealthScheduleTemplate: mocks.getHealthScheduleTemplate,
  createPuppyHealthTask: mocks.createPuppyHealthTask,
}));

vi.mock('../sales', () => ({
  getSale: mocks.getSale,
  getClient: mocks.getClient,
}));

vi.mock('../operations', () => ({ getExpenses: mocks.getExpenses }));
vi.mock('../settings', () => ({ getBreederSettings: mocks.getBreederSettings }));
vi.mock('../connection', () => ({ query: mocks.query }));
vi.mock('../breeding', () => ({ getHeatCycles: mocks.getHeatCycles }));
vi.mock('../litters', () => ({
  getLitters: mocks.getLitters,
  getLitter: mocks.getLitter,
}));

import { getPacketData } from '../legacy';

const now = new Date('2026-07-14T12:00:00.000Z');
const dog: Dog = {
  id: 'dog-1',
  name: 'Diamond Queen',
  sex: 'F',
  breed: 'American Bully',
  status: 'active',
  createdAt: now,
  updatedAt: now,
};
const client: Client = {
  id: 'client-1',
  name: 'Synthetic Client',
  createdAt: now,
  updatedAt: now,
};
const sale: Sale = {
  id: 'sale-1',
  clientId: client.id,
  saleDate: now,
  price: 4500,
  isLocalPickup: true,
  paymentStatus: 'paid_in_full',
  createdAt: now,
  updatedAt: now,
};
const breederSettings: BreederSettings = {
  kennelName: 'Respectabullz',
  breederName: 'Synthetic Breeder',
  addressLine1: '',
  city: '',
  state: '',
  postalCode: '',
  phone: '',
  email: '',
};

describe('getPacketData sale lookup', () => {
  beforeEach(() => {
    mocks.getDogs.mockResolvedValue([dog]);
    mocks.getDogPhotos.mockResolvedValue([]);
    mocks.getVaccinations.mockResolvedValue([]);
    mocks.getMedicalRecords.mockResolvedValue([]);
    mocks.getWeightEntries.mockResolvedValue([]);
    mocks.getGeneticTests.mockResolvedValue([]);
    mocks.getExpenses.mockResolvedValue([]);
    mocks.getBreederSettings.mockResolvedValue(breederSettings);
    mocks.getSale.mockResolvedValue(sale);
    mocks.getClient.mockResolvedValue(client);
  });

  it('looks up the latest sale through sale_puppies', async () => {
    mocks.query.mockResolvedValue([{ sale_id: sale.id }]);

    const packet = await getPacketData(dog.id);

    expect(mocks.query).toHaveBeenCalledOnce();
    const [sql, params] = mocks.query.mock.calls[0];
    expect(sql).toContain('FROM sale_puppies sp');
    expect(sql).toContain('INNER JOIN sales s ON s.id = sp.sale_id');
    expect(sql).toContain('WHERE sp.dog_id = ?');
    expect(sql).toContain('ORDER BY s.sale_date DESC, s.id DESC');
    expect(sql).toContain('LIMIT 1');
    expect(params).toEqual([dog.id]);
    expect(mocks.getSale).toHaveBeenCalledWith(sale.id);
    expect(mocks.getClient).toHaveBeenCalledWith(client.id);
    expect(packet?.sale).toBe(sale);
    expect(packet?.client).toBe(client);
  });

  it('returns packet data without financial records when the dog has no sale', async () => {
    mocks.query.mockResolvedValue([]);

    const packet = await getPacketData(dog.id);

    expect(packet?.sale).toBeNull();
    expect(packet?.client).toBeNull();
    expect(mocks.getSale).not.toHaveBeenCalled();
    expect(mocks.getClient).not.toHaveBeenCalled();
  });
});
