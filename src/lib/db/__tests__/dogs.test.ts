// Integration tests for dog database operations
// These tests use mocked SQLite to verify the SQL queries

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the connection module before importing dogs
vi.mock('../connection', () => ({
  query: vi.fn(),
  execute: vi.fn(),
}));

import { query, execute } from '../connection';
import { getDogs, getDog, createDog, updateDog, deleteDog } from '../dogs';

describe('Dog Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDogs', () => {
    it('queries all dogs ordered by name', async () => {
      const mockDogs = [
        {
          id: 'dog-1',
          name: 'Bella',
          sex: 'F',
          breed: 'French Bulldog',
          status: 'active',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          registration_number: null,
          date_of_birth: null,
          color: null,
          microchip_number: null,
          profile_photo_path: null,
          notes: null,
          sire_id: null,
          dam_id: null,
          litter_id: null,
          evaluation_category: null,
          structure_notes: null,
          temperament_notes: null,
          registration_status: null,
          registration_type: null,
          registry_name: null,
          registration_deadline: null,
        },
      ];

      vi.mocked(query).mockResolvedValue(mockDogs);

      const result = await getDogs();

      expect(query).toHaveBeenCalledWith('SELECT * FROM dogs ORDER BY name');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bella');
      expect(result[0].sex).toBe('F');
    });

    it('returns empty array when no dogs exist', async () => {
      vi.mocked(query).mockResolvedValue([]);

      const result = await getDogs();

      expect(result).toEqual([]);
    });
  });

  describe('getDog', () => {
    it('fetches a single dog by ID with relations', async () => {
      const mockDog = {
        id: 'dog-1',
        name: 'Max',
        sex: 'M',
        breed: 'French Bulldog',
        status: 'active',
        sire_id: 'dog-sire',
        dam_id: 'dog-dam',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        registration_number: null,
        date_of_birth: '2023-01-15T00:00:00.000Z',
        color: 'Brindle',
        microchip_number: null,
        profile_photo_path: null,
        notes: null,
        litter_id: null,
        evaluation_category: null,
        structure_notes: null,
        temperament_notes: null,
        registration_status: null,
        registration_type: null,
        registry_name: null,
        registration_deadline: null,
      };

      const mockSire = { ...mockDog, id: 'dog-sire', name: 'Sire', sire_id: null, dam_id: null };
      const mockDam = { ...mockDog, id: 'dog-dam', name: 'Dam', sex: 'F', sire_id: null, dam_id: null };

      vi.mocked(query)
        .mockResolvedValueOnce([mockDog]) // Main dog query
        .mockResolvedValueOnce([mockSire]) // Sire query
        .mockResolvedValueOnce([mockDam]) // Dam query
        .mockResolvedValueOnce([]); // Photos query

      const result = await getDog('dog-1');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Max');
      expect(result?.sire?.name).toBe('Sire');
      expect(result?.dam?.name).toBe('Dam');
      expect(result?.dateOfBirth).toBeInstanceOf(Date);
    });

    it('returns null when dog is not found', async () => {
      vi.mocked(query).mockResolvedValue([]);

      const result = await getDog('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createDog', () => {
    it('inserts a new dog with all required fields', async () => {
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });
      
      // Mock the getDog call after creation
      const createdDog = {
        id: expect.any(String),
        name: 'Puppy',
        sex: 'M',
        breed: 'French Bulldog',
        status: 'active',
        created_at: expect.any(String),
        updated_at: expect.any(String),
        registration_number: null,
        date_of_birth: null,
        color: null,
        microchip_number: null,
        profile_photo_path: null,
        notes: null,
        sire_id: null,
        dam_id: null,
        litter_id: null,
        evaluation_category: null,
        structure_notes: null,
        temperament_notes: null,
        registration_status: null,
        registration_type: null,
        registry_name: null,
        registration_deadline: null,
      };

      vi.mocked(query)
        .mockResolvedValueOnce([createdDog])
        .mockResolvedValueOnce([]); // No sire
      // .mockResolvedValueOnce([]); // No dam
      // .mockResolvedValueOnce([]); // No photos

      const input = {
        name: 'Puppy',
        sex: 'M' as const,
        breed: 'French Bulldog',
        status: 'active' as const,
      };

      const result = await createDog(input);

      expect(execute).toHaveBeenCalled();
      const executeCall = vi.mocked(execute).mock.calls[0];
      expect(executeCall[0]).toContain('INSERT INTO dogs');
      expect(result.name).toBe('Puppy');
    });

    it('handles optional fields', async () => {
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      const createdDog = {
        id: 'dog-new',
        name: 'Bella',
        sex: 'F',
        breed: 'English Bulldog',
        status: 'active',
        color: 'White',
        notes: 'Sweet girl',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        registration_number: 'REG123',
        date_of_birth: '2023-06-15T00:00:00.000Z',
        microchip_number: 'CHIP456',
        profile_photo_path: null,
        sire_id: null,
        dam_id: null,
        litter_id: null,
        evaluation_category: 'show_prospect',
        structure_notes: null,
        temperament_notes: null,
        registration_status: null,
        registration_type: null,
        registry_name: null,
        registration_deadline: null,
      };

      vi.mocked(query)
        .mockResolvedValueOnce([createdDog])
        .mockResolvedValueOnce([]); // No photos

      const input = {
        name: 'Bella',
        sex: 'F' as const,
        breed: 'English Bulldog',
        status: 'active' as const,
        color: 'White',
        notes: 'Sweet girl',
        registrationNumber: 'REG123',
        dateOfBirth: new Date('2023-06-15'),
        microchipNumber: 'CHIP456',
        evaluationCategory: 'show_prospect' as const,
      };

      const result = await createDog(input);

      expect(result.color).toBe('White');
      expect(result.notes).toBe('Sweet girl');
      expect(result.registrationNumber).toBe('REG123');
    });
  });

  describe('updateDog', () => {
    it('updates specific fields', async () => {
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      const updatedDog = {
        id: 'dog-1',
        name: 'Max Updated',
        sex: 'M',
        breed: 'French Bulldog',
        status: 'retired',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z',
        registration_number: null,
        date_of_birth: null,
        color: null,
        microchip_number: null,
        profile_photo_path: null,
        notes: null,
        sire_id: null,
        dam_id: null,
        litter_id: null,
        evaluation_category: null,
        structure_notes: null,
        temperament_notes: null,
        registration_status: null,
        registration_type: null,
        registry_name: null,
        registration_deadline: null,
      };

      vi.mocked(query)
        .mockResolvedValueOnce([updatedDog])
        .mockResolvedValueOnce([]); // No photos

      const result = await updateDog('dog-1', { name: 'Max Updated', status: 'retired' });

      expect(execute).toHaveBeenCalled();
      const executeCall = vi.mocked(execute).mock.calls[0];
      expect(executeCall[0]).toContain('UPDATE dogs SET');
      expect(executeCall[0]).toContain('name = ?');
      expect(executeCall[0]).toContain('status = ?');
      expect(result?.name).toBe('Max Updated');
      expect(result?.status).toBe('retired');
    });

    it('returns current dog if no updates provided', async () => {
      const existingDog = {
        id: 'dog-1',
        name: 'Max',
        sex: 'M',
        breed: 'French Bulldog',
        status: 'active',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        registration_number: null,
        date_of_birth: null,
        color: null,
        microchip_number: null,
        profile_photo_path: null,
        notes: null,
        sire_id: null,
        dam_id: null,
        litter_id: null,
        evaluation_category: null,
        structure_notes: null,
        temperament_notes: null,
        registration_status: null,
        registration_type: null,
        registry_name: null,
        registration_deadline: null,
      };

      vi.mocked(query)
        .mockResolvedValueOnce([existingDog])
        .mockResolvedValueOnce([]); // No photos

      const result = await updateDog('dog-1', {});

      expect(execute).not.toHaveBeenCalled();
      expect(result?.name).toBe('Max');
    });
  });

  describe('deleteDog', () => {
    it('deletes a dog and returns true', async () => {
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      const result = await deleteDog('dog-1');

      expect(execute).toHaveBeenCalledWith('DELETE FROM dogs WHERE id = ?', ['dog-1']);
      expect(result).toBe(true);
    });

    it('returns false when dog not found', async () => {
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 0 });

      const result = await deleteDog('nonexistent');

      expect(result).toBe(false);
    });
  });
});

