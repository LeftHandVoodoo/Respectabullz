// Integration tests for operations database module (Expenses, Transports)
// Tests the transport-expense relationship and cross-module behavior

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the connection module before importing operations
vi.mock('../connection', () => ({
  query: vi.fn(),
  execute: vi.fn(),
}));

// Mock generateId to return predictable IDs
vi.mock('../utils', async () => {
  const actual = await vi.importActual('../utils');
  let idCounter = 0;
  return {
    ...actual,
    generateId: vi.fn(() => `test-id-${++idCounter}`),
    nowIso: vi.fn(() => '2024-01-15T12:00:00.000Z'),
  };
});

import { query, execute } from '../connection';
import {
  getExpenses,
  createExpense,
  deleteExpense,
  getTransports,
  getTransport,
  createTransport,
  updateTransport,
  deleteTransport,
} from '../operations';

describe('Expense Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getExpenses', () => {
    it('queries all expenses ordered by date descending', async () => {
      const mockExpenses = [
        {
          id: 'exp-1',
          date: '2024-01-15T00:00:00.000Z',
          amount: 150.00,
          category: 'vet',
          vendor_name: 'Pet Clinic',
          description: 'Annual checkup',
          payment_method: 'credit_card',
          is_tax_deductible: 1,
          receipt_path: null,
          related_dog_id: 'dog-1',
          related_litter_id: null,
          notes: null,
          created_at: '2024-01-15T00:00:00.000Z',
          updated_at: '2024-01-15T00:00:00.000Z',
        },
      ];

      vi.mocked(query).mockResolvedValue(mockExpenses);

      const result = await getExpenses();

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM expenses WHERE 1=1'),
        []
      );
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(150.00);
      expect(result[0].category).toBe('vet');
      expect(result[0].isTaxDeductible).toBe(true);
    });

    it('filters expenses by dogId', async () => {
      vi.mocked(query).mockResolvedValue([]);

      await getExpenses({ dogId: 'dog-123' });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('related_dog_id = ?'),
        ['dog-123']
      );
    });

    it('filters expenses by category', async () => {
      vi.mocked(query).mockResolvedValue([]);

      await getExpenses({ category: 'transport' });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('category = ?'),
        ['transport']
      );
    });

    it('filters expenses by litterId', async () => {
      vi.mocked(query).mockResolvedValue([]);

      await getExpenses({ litterId: 'litter-123' });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('related_litter_id = ?'),
        ['litter-123']
      );
    });

    it('combines multiple filters', async () => {
      vi.mocked(query).mockResolvedValue([]);

      await getExpenses({ dogId: 'dog-1', category: 'vet' });

      const calledSql = vi.mocked(query).mock.calls[0][0] as string;
      expect(calledSql).toContain('related_dog_id = ?');
      expect(calledSql).toContain('category = ?');
      expect(vi.mocked(query).mock.calls[0][1]).toEqual(['dog-1', 'vet']);
    });
  });

  describe('createExpense', () => {
    it('inserts a new expense with required fields', async () => {
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      const createdExpense = {
        id: 'test-id-1',
        date: '2024-01-15T00:00:00.000Z',
        amount: 50.00,
        category: 'food',
        vendor_name: null,
        description: null,
        payment_method: null,
        is_tax_deductible: 0,
        receipt_path: null,
        related_dog_id: null,
        related_litter_id: null,
        notes: null,
        created_at: '2024-01-15T12:00:00.000Z',
        updated_at: '2024-01-15T12:00:00.000Z',
      };

      vi.mocked(query).mockResolvedValueOnce([createdExpense]);

      const result = await createExpense({
        date: new Date('2024-01-15'),
        amount: 50.00,
        category: 'food',
        isTaxDeductible: false,
      });

      expect(execute).toHaveBeenCalled();
      const executeCall = vi.mocked(execute).mock.calls[0];
      expect(executeCall[0]).toContain('INSERT INTO expenses');
      expect(result.amount).toBe(50.00);
      expect(result.category).toBe('food');
    });

    it('normalizes empty string relatedDogId to null', async () => {
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      const createdExpense = {
        id: 'test-id-1',
        date: '2024-01-15T00:00:00.000Z',
        amount: 50.00,
        category: 'misc',
        vendor_name: null,
        description: null,
        payment_method: null,
        is_tax_deductible: 0,
        receipt_path: null,
        related_dog_id: null,
        related_litter_id: null,
        notes: null,
        created_at: '2024-01-15T12:00:00.000Z',
        updated_at: '2024-01-15T12:00:00.000Z',
      };

      vi.mocked(query).mockResolvedValueOnce([createdExpense]);

      await createExpense({
        date: new Date('2024-01-15'),
        amount: 50.00,
        category: 'misc',
        relatedDogId: '', // Empty string should become null
        isTaxDeductible: false,
      });

      const executeCall = vi.mocked(execute).mock.calls[0];
      // The 10th parameter (index 9) is related_dog_id - should be null
      expect(executeCall[1]?.[9]).toBeNull();
    });
  });

  describe('deleteExpense', () => {
    it('deletes an expense and returns true', async () => {
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      const result = await deleteExpense('exp-1');

      expect(execute).toHaveBeenCalledWith('DELETE FROM expenses WHERE id = ?', ['exp-1']);
      expect(result).toBe(true);
    });

    it('returns false when expense not found', async () => {
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 0 });

      const result = await deleteExpense('nonexistent');

      expect(result).toBe(false);
    });
  });
});

describe('Transport Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTransports', () => {
    it('queries all transports with dog info', async () => {
      const mockTransports = [
        {
          id: 'trans-1',
          dog_id: 'dog-1',
          date: '2024-01-15T00:00:00.000Z',
          mode: 'flight',
          shipper_business_name: 'Pet Airways',
          contact_name: 'John Doe',
          phone: '555-1234',
          email: 'john@petairways.com',
          origin_city: 'Los Angeles',
          origin_state: 'CA',
          destination_city: 'New York',
          destination_state: 'NY',
          tracking_number: 'TRK123456',
          cost: 350.00,
          expense_id: 'exp-1',
          notes: 'Handle with care',
          created_at: '2024-01-15T00:00:00.000Z',
          updated_at: '2024-01-15T00:00:00.000Z',
          dog_name: 'Bella',
        },
      ];

      vi.mocked(query).mockResolvedValue(mockTransports);

      const result = await getTransports();

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT t.*, d.name as dog_name'),
        []
      );
      expect(result).toHaveLength(1);
      expect(result[0].mode).toBe('flight');
      expect(result[0].shipperBusinessName).toBe('Pet Airways');
      expect(result[0].dog?.name).toBe('Bella');
    });

    it('filters transports by dogId', async () => {
      vi.mocked(query).mockResolvedValue([]);

      await getTransports('dog-123');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE t.dog_id = ?'),
        ['dog-123']
      );
    });

    it('returns empty array when no transports exist', async () => {
      vi.mocked(query).mockResolvedValue([]);

      const result = await getTransports();

      expect(result).toEqual([]);
    });
  });

  describe('getTransport', () => {
    it('fetches a single transport by ID', async () => {
      const mockTransport = {
        id: 'trans-1',
        dog_id: 'dog-1',
        date: '2024-01-15T00:00:00.000Z',
        mode: 'ground',
        shipper_business_name: 'Ground Shipping Co',
        contact_name: null,
        phone: null,
        email: null,
        origin_city: 'Chicago',
        origin_state: 'IL',
        destination_city: 'Detroit',
        destination_state: 'MI',
        tracking_number: null,
        cost: 200.00,
        expense_id: 'exp-1',
        notes: null,
        created_at: '2024-01-15T00:00:00.000Z',
        updated_at: '2024-01-15T00:00:00.000Z',
      };

      vi.mocked(query).mockResolvedValue([mockTransport]);

      const result = await getTransport('trans-1');

      expect(result).not.toBeNull();
      expect(result?.mode).toBe('ground');
      expect(result?.cost).toBe(200.00);
      expect(result?.date).toBeInstanceOf(Date);
    });

    it('returns null when transport not found', async () => {
      vi.mocked(query).mockResolvedValue([]);

      const result = await getTransport('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateTransport', () => {
    it('updates specific fields', async () => {
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      const updatedTransport = {
        id: 'trans-1',
        dog_id: 'dog-1',
        date: '2024-01-20T00:00:00.000Z',
        mode: 'flight',
        shipper_business_name: 'Updated Shipper',
        contact_name: null,
        phone: null,
        email: null,
        origin_city: null,
        origin_state: null,
        destination_city: null,
        destination_state: null,
        tracking_number: 'NEW-TRACK',
        cost: 400.00,
        expense_id: null,
        notes: null,
        created_at: '2024-01-15T00:00:00.000Z',
        updated_at: '2024-01-20T00:00:00.000Z',
      };

      vi.mocked(query).mockResolvedValueOnce([updatedTransport]);

      const result = await updateTransport('trans-1', {
        shipperBusinessName: 'Updated Shipper',
        trackingNumber: 'NEW-TRACK',
        cost: 400.00,
      });

      expect(execute).toHaveBeenCalled();
      const executeCall = vi.mocked(execute).mock.calls[0];
      expect(executeCall[0]).toContain('UPDATE transports SET');
      expect(result?.shipperBusinessName).toBe('Updated Shipper');
      expect(result?.trackingNumber).toBe('NEW-TRACK');
    });

    it('returns current transport if no updates provided', async () => {
      const existingTransport = {
        id: 'trans-1',
        dog_id: 'dog-1',
        date: '2024-01-15T00:00:00.000Z',
        mode: 'pickup',
        shipper_business_name: null,
        contact_name: null,
        phone: null,
        email: null,
        origin_city: null,
        origin_state: null,
        destination_city: null,
        destination_state: null,
        tracking_number: null,
        cost: null,
        expense_id: null,
        notes: null,
        created_at: '2024-01-15T00:00:00.000Z',
        updated_at: '2024-01-15T00:00:00.000Z',
      };

      vi.mocked(query).mockResolvedValueOnce([existingTransport]);

      const result = await updateTransport('trans-1', {});

      expect(execute).not.toHaveBeenCalled();
      expect(result?.mode).toBe('pickup');
    });
  });

  describe('deleteTransport', () => {
    it('deletes transport and returns true', async () => {
      // First query returns transport without expense
      vi.mocked(query).mockResolvedValueOnce([{
        id: 'trans-1',
        dog_id: 'dog-1',
        date: '2024-01-15T00:00:00.000Z',
        mode: 'pickup',
        shipper_business_name: null,
        contact_name: null,
        phone: null,
        email: null,
        origin_city: null,
        origin_state: null,
        destination_city: null,
        destination_state: null,
        tracking_number: null,
        cost: null,
        expense_id: null,
        notes: null,
        created_at: '2024-01-15T00:00:00.000Z',
        updated_at: '2024-01-15T00:00:00.000Z',
      }]);
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      const result = await deleteTransport('trans-1');

      expect(execute).toHaveBeenCalledWith('DELETE FROM transports WHERE id = ?', ['trans-1']);
      expect(result).toBe(true);
    });

    it('returns false when transport not found', async () => {
      vi.mocked(query).mockResolvedValueOnce([]);
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 0 });

      const result = await deleteTransport('nonexistent');

      expect(result).toBe(false);
    });
  });
});

describe('Transport-Expense Relationship', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTransport with cost', () => {
    it('automatically creates linked expense when cost is provided', async () => {
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      // Mock for expense creation query
      const createdExpense = {
        id: 'test-id-1',
        date: '2024-01-15T00:00:00.000Z',
        amount: 350.00,
        category: 'transport',
        vendor_name: 'Pet Airways',
        description: 'Transport for dog',
        payment_method: null,
        is_tax_deductible: 0,
        receipt_path: null,
        related_dog_id: 'dog-1',
        related_litter_id: null,
        notes: null,
        created_at: '2024-01-15T12:00:00.000Z',
        updated_at: '2024-01-15T12:00:00.000Z',
      };

      // Mock for transport creation query
      const createdTransport = {
        id: 'test-id-2',
        dog_id: 'dog-1',
        date: '2024-01-15T00:00:00.000Z',
        mode: 'flight',
        shipper_business_name: 'Pet Airways',
        contact_name: null,
        phone: null,
        email: null,
        origin_city: 'LA',
        origin_state: 'CA',
        destination_city: 'NY',
        destination_state: 'NY',
        tracking_number: null,
        cost: 350.00,
        expense_id: 'test-id-1', // Linked to expense
        notes: null,
        created_at: '2024-01-15T12:00:00.000Z',
        updated_at: '2024-01-15T12:00:00.000Z',
      };

      vi.mocked(query)
        .mockResolvedValueOnce([createdExpense]) // getExpense after createExpense
        .mockResolvedValueOnce([createdTransport]); // getTransport after createTransport

      const result = await createTransport({
        dogId: 'dog-1',
        date: new Date('2024-01-15'),
        mode: 'flight',
        shipperBusinessName: 'Pet Airways',
        originCity: 'LA',
        originState: 'CA',
        destinationCity: 'NY',
        destinationState: 'NY',
        cost: 350.00,
      });

      // Should have called execute 2 times:
      // 1. createExpense inserts expense (with skipTransportCreation flag, no auto-transport)
      // 2. createTransport inserts its transport
      expect(execute).toHaveBeenCalledTimes(2);

      // First call should be expense insert
      const firstCall = vi.mocked(execute).mock.calls[0];
      expect(firstCall[0]).toContain('INSERT INTO expenses');

      // Second call is the transport insert from createTransport
      const secondCall = vi.mocked(execute).mock.calls[1];
      expect(secondCall[0]).toContain('INSERT INTO transports');

      expect(result.cost).toBe(350.00);
      expect(result.expenseId).toBe('test-id-1');
    });

    it('does not create expense when cost is 0', async () => {
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      const createdTransport = {
        id: 'test-id-1',
        dog_id: 'dog-1',
        date: '2024-01-15T00:00:00.000Z',
        mode: 'pickup',
        shipper_business_name: null,
        contact_name: null,
        phone: null,
        email: null,
        origin_city: null,
        origin_state: null,
        destination_city: null,
        destination_state: null,
        tracking_number: null,
        cost: 0,
        expense_id: null,
        notes: null,
        created_at: '2024-01-15T12:00:00.000Z',
        updated_at: '2024-01-15T12:00:00.000Z',
      };

      vi.mocked(query).mockResolvedValueOnce([createdTransport]);

      const result = await createTransport({
        dogId: 'dog-1',
        date: new Date('2024-01-15'),
        mode: 'pickup',
        cost: 0,
      });

      // Should only call execute once for transport (no expense)
      expect(execute).toHaveBeenCalledTimes(1);
      expect(result.expenseId).toBeNull();
    });

    it('does not create expense when cost is not provided', async () => {
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      const createdTransport = {
        id: 'test-id-1',
        dog_id: 'dog-1',
        date: '2024-01-15T00:00:00.000Z',
        mode: 'pickup',
        shipper_business_name: null,
        contact_name: null,
        phone: null,
        email: null,
        origin_city: null,
        origin_state: null,
        destination_city: null,
        destination_state: null,
        tracking_number: null,
        cost: null,
        expense_id: null,
        notes: null,
        created_at: '2024-01-15T12:00:00.000Z',
        updated_at: '2024-01-15T12:00:00.000Z',
      };

      vi.mocked(query).mockResolvedValueOnce([createdTransport]);

      const result = await createTransport({
        dogId: 'dog-1',
        date: new Date('2024-01-15'),
        mode: 'pickup',
      });

      expect(execute).toHaveBeenCalledTimes(1);
      expect(result.expenseId).toBeNull();
    });
  });

  describe('deleteTransport with linked expense', () => {
    it('deletes linked expense when transport is deleted', async () => {
      // Mock getTransport to return transport with expenseId
      vi.mocked(query).mockResolvedValueOnce([{
        id: 'trans-1',
        dog_id: 'dog-1',
        date: '2024-01-15T00:00:00.000Z',
        mode: 'flight',
        shipper_business_name: 'Pet Airways',
        contact_name: null,
        phone: null,
        email: null,
        origin_city: null,
        origin_state: null,
        destination_city: null,
        destination_state: null,
        tracking_number: null,
        cost: 350.00,
        expense_id: 'exp-linked', // Has linked expense
        notes: null,
        created_at: '2024-01-15T00:00:00.000Z',
        updated_at: '2024-01-15T00:00:00.000Z',
      }]);

      vi.mocked(execute)
        .mockResolvedValueOnce({ lastInsertId: 0, rowsAffected: 1 }) // deleteExpense: delete linked transports
        .mockResolvedValueOnce({ lastInsertId: 0, rowsAffected: 1 }) // deleteExpense: delete expense
        .mockResolvedValueOnce({ lastInsertId: 0, rowsAffected: 1 }); // deleteTransport: delete transport

      const result = await deleteTransport('trans-1');

      // Should call execute 3 times:
      // 1. deleteExpense deletes any transports linked to the expense
      // 2. deleteExpense deletes the expense itself
      // 3. deleteTransport deletes the transport
      expect(execute).toHaveBeenCalledTimes(3);

      // First call: deleteExpense deletes transports linked to this expense
      expect(execute).toHaveBeenNthCalledWith(1, 'DELETE FROM transports WHERE expense_id = ?', ['exp-linked']);

      // Second call: deleteExpense deletes the expense
      expect(execute).toHaveBeenNthCalledWith(2, 'DELETE FROM expenses WHERE id = ?', ['exp-linked']);

      // Third call: deleteTransport deletes the transport
      expect(execute).toHaveBeenNthCalledWith(3, 'DELETE FROM transports WHERE id = ?', ['trans-1']);

      expect(result).toBe(true);
    });

    it('only deletes transport when no linked expense exists', async () => {
      // Mock getTransport to return transport without expenseId
      vi.mocked(query).mockResolvedValueOnce([{
        id: 'trans-1',
        dog_id: 'dog-1',
        date: '2024-01-15T00:00:00.000Z',
        mode: 'pickup',
        shipper_business_name: null,
        contact_name: null,
        phone: null,
        email: null,
        origin_city: null,
        origin_state: null,
        destination_city: null,
        destination_state: null,
        tracking_number: null,
        cost: null,
        expense_id: null, // No linked expense
        notes: null,
        created_at: '2024-01-15T00:00:00.000Z',
        updated_at: '2024-01-15T00:00:00.000Z',
      }]);

      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      await deleteTransport('trans-1');

      // Should only call execute once for transport delete
      expect(execute).toHaveBeenCalledTimes(1);
      expect(execute).toHaveBeenCalledWith('DELETE FROM transports WHERE id = ?', ['trans-1']);
    });
  });

  describe('Expense category filtering for transport expenses', () => {
    it('filters transport-category expenses correctly', async () => {
      const mockTransportExpenses = [
        {
          id: 'exp-1',
          date: '2024-01-15T00:00:00.000Z',
          amount: 350.00,
          category: 'transport',
          vendor_name: 'Pet Airways',
          description: 'Transport for dog',
          payment_method: null,
          is_tax_deductible: 0,
          receipt_path: null,
          related_dog_id: 'dog-1',
          related_litter_id: null,
          notes: null,
          created_at: '2024-01-15T00:00:00.000Z',
          updated_at: '2024-01-15T00:00:00.000Z',
        },
        {
          id: 'exp-2',
          date: '2024-01-10T00:00:00.000Z',
          amount: 200.00,
          category: 'transport',
          vendor_name: 'Ground Shipper',
          description: 'Transport for dog',
          payment_method: null,
          is_tax_deductible: 0,
          receipt_path: null,
          related_dog_id: 'dog-1',
          related_litter_id: null,
          notes: null,
          created_at: '2024-01-10T00:00:00.000Z',
          updated_at: '2024-01-10T00:00:00.000Z',
        },
      ];

      vi.mocked(query).mockResolvedValue(mockTransportExpenses);

      const result = await getExpenses({ category: 'transport' });

      expect(result).toHaveLength(2);
      expect(result.every(e => e.category === 'transport')).toBe(true);
    });

    it('filters expenses by both dogId and transport category', async () => {
      vi.mocked(query).mockResolvedValue([]);

      await getExpenses({ dogId: 'dog-1', category: 'transport' });

      const calledSql = vi.mocked(query).mock.calls[0][0] as string;
      expect(calledSql).toContain('related_dog_id = ?');
      expect(calledSql).toContain('category = ?');
    });
  });
});

describe('Cross-Module Display Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Transport records for dog detail page', () => {
    it('fetches transports for specific dog with dog info populated', async () => {
      const mockTransportsForDog = [
        {
          id: 'trans-1',
          dog_id: 'dog-1',
          date: '2024-01-15T00:00:00.000Z',
          mode: 'flight',
          shipper_business_name: 'Pet Airways',
          contact_name: 'John',
          phone: '555-1234',
          email: null,
          origin_city: 'LA',
          origin_state: 'CA',
          destination_city: 'NY',
          destination_state: 'NY',
          tracking_number: 'TRK123',
          cost: 350.00,
          expense_id: 'exp-1',
          notes: null,
          created_at: '2024-01-15T00:00:00.000Z',
          updated_at: '2024-01-15T00:00:00.000Z',
          dog_name: 'Bella',
        },
        {
          id: 'trans-2',
          dog_id: 'dog-1',
          date: '2024-01-10T00:00:00.000Z',
          mode: 'ground',
          shipper_business_name: 'Ground Co',
          contact_name: null,
          phone: null,
          email: null,
          origin_city: 'Chicago',
          origin_state: 'IL',
          destination_city: 'LA',
          destination_state: 'CA',
          tracking_number: null,
          cost: 200.00,
          expense_id: 'exp-2',
          notes: null,
          created_at: '2024-01-10T00:00:00.000Z',
          updated_at: '2024-01-10T00:00:00.000Z',
          dog_name: 'Bella',
        },
      ];

      vi.mocked(query).mockResolvedValue(mockTransportsForDog);

      const result = await getTransports('dog-1');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE t.dog_id = ?'),
        ['dog-1']
      );
      expect(result).toHaveLength(2);
      expect(result[0].dog?.name).toBe('Bella');
      expect(result[1].dog?.name).toBe('Bella');
    });
  });

  describe('Expenses for dog detail Financial tab', () => {
    it('fetches all expense categories for a dog including transport', async () => {
      const mockExpensesForDog = [
        {
          id: 'exp-1',
          date: '2024-01-15T00:00:00.000Z',
          amount: 350.00,
          category: 'transport',
          vendor_name: 'Pet Airways',
          description: 'Transport for dog',
          payment_method: null,
          is_tax_deductible: 0,
          receipt_path: null,
          related_dog_id: 'dog-1',
          related_litter_id: null,
          notes: null,
          created_at: '2024-01-15T00:00:00.000Z',
          updated_at: '2024-01-15T00:00:00.000Z',
        },
        {
          id: 'exp-2',
          date: '2024-01-12T00:00:00.000Z',
          amount: 150.00,
          category: 'vet',
          vendor_name: 'Pet Clinic',
          description: 'Checkup',
          payment_method: null,
          is_tax_deductible: 1,
          receipt_path: null,
          related_dog_id: 'dog-1',
          related_litter_id: null,
          notes: null,
          created_at: '2024-01-12T00:00:00.000Z',
          updated_at: '2024-01-12T00:00:00.000Z',
        },
      ];

      vi.mocked(query).mockResolvedValue(mockExpensesForDog);

      const result = await getExpenses({ dogId: 'dog-1' });

      expect(result).toHaveLength(2);
      expect(result.find(e => e.category === 'transport')).toBeDefined();
      expect(result.find(e => e.category === 'vet')).toBeDefined();
    });
  });

  describe('Global transport page display', () => {
    it('fetches all transports across all dogs with dog names', async () => {
      const mockAllTransports = [
        {
          id: 'trans-1',
          dog_id: 'dog-1',
          date: '2024-01-15T00:00:00.000Z',
          mode: 'flight',
          shipper_business_name: 'Pet Airways',
          contact_name: null,
          phone: null,
          email: null,
          origin_city: 'LA',
          origin_state: 'CA',
          destination_city: 'NY',
          destination_state: 'NY',
          tracking_number: null,
          cost: 350.00,
          expense_id: 'exp-1',
          notes: null,
          created_at: '2024-01-15T00:00:00.000Z',
          updated_at: '2024-01-15T00:00:00.000Z',
          dog_name: 'Bella',
        },
        {
          id: 'trans-2',
          dog_id: 'dog-2',
          date: '2024-01-10T00:00:00.000Z',
          mode: 'ground',
          shipper_business_name: 'Ground Co',
          contact_name: null,
          phone: null,
          email: null,
          origin_city: 'Miami',
          origin_state: 'FL',
          destination_city: 'Atlanta',
          destination_state: 'GA',
          tracking_number: null,
          cost: 150.00,
          expense_id: 'exp-2',
          notes: null,
          created_at: '2024-01-10T00:00:00.000Z',
          updated_at: '2024-01-10T00:00:00.000Z',
          dog_name: 'Max',
        },
      ];

      vi.mocked(query).mockResolvedValue(mockAllTransports);

      const result = await getTransports();

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT t.*, d.name as dog_name'),
        []
      );
      expect(result).toHaveLength(2);
      expect(result[0].dog?.name).toBe('Bella');
      expect(result[1].dog?.name).toBe('Max');
    });
  });
});
