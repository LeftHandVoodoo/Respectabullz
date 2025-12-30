// Integration tests for contacts database operations
// These tests use mocked SQLite to verify the SQL queries

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the connection module before importing contacts
vi.mock('../connection', () => ({
  query: vi.fn(),
  execute: vi.fn(),
}));

import { query, execute } from '../connection';
import {
  getContactCategories,
  getContactCategory,
  getContactCategoryByName,
  createContactCategory,
  updateContactCategory,
  deleteContactCategory,
  getContacts,
  getContact,
  getContactsByCategory,
  createContact,
  updateContact,
  deleteContact,
  getCategoriesForContact,
  setContactCategories,
  addCategoryToContact,
  removeCategoryFromContact,
  searchContacts,
} from '../contacts';

// ============================================
// CONTACT CATEGORIES TESTS
// ============================================

describe('Contact Categories Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getContactCategories', () => {
    it('queries all categories ordered by predefined status and name', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Client',
          color: '#3B82F6',
          is_predefined: 1,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'cat-2',
          name: 'Custom',
          color: '#FF0000',
          is_predefined: 0,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      ];

      vi.mocked(query).mockResolvedValue(mockCategories);

      const result = await getContactCategories();

      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM contact_categories ORDER BY is_predefined DESC, name'
      );
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Client');
      expect(result[0].isPredefined).toBe(true);
      expect(result[1].isPredefined).toBe(false);
    });

    it('returns empty array when no categories exist', async () => {
      vi.mocked(query).mockResolvedValue([]);

      const result = await getContactCategories();

      expect(result).toEqual([]);
    });
  });

  describe('getContactCategory', () => {
    it('fetches a single category by ID', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Vet',
        color: '#EF4444',
        is_predefined: 1,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(query).mockResolvedValue([mockCategory]);

      const result = await getContactCategory('cat-1');

      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM contact_categories WHERE id = ?',
        ['cat-1']
      );
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Vet');
      expect(result?.color).toBe('#EF4444');
    });

    it('returns null when category is not found', async () => {
      vi.mocked(query).mockResolvedValue([]);

      const result = await getContactCategory('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getContactCategoryByName', () => {
    it('fetches a category by name', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Breeder',
        color: '#10B981',
        is_predefined: 1,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(query).mockResolvedValue([mockCategory]);

      const result = await getContactCategoryByName('Breeder');

      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM contact_categories WHERE name = ?',
        ['Breeder']
      );
      expect(result?.name).toBe('Breeder');
    });

    it('returns null when category name is not found', async () => {
      vi.mocked(query).mockResolvedValue([]);

      const result = await getContactCategoryByName('Unknown');

      expect(result).toBeNull();
    });
  });

  describe('createContactCategory', () => {
    it('inserts a new category with all fields', async () => {
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      const input = {
        name: 'Supplier',
        color: '#ABCDEF',
        isPredefined: false,
      };

      const result = await createContactCategory(input);

      expect(execute).toHaveBeenCalled();
      const executeCall = vi.mocked(execute).mock.calls[0];
      expect(executeCall[0]).toContain('INSERT INTO contact_categories');
      expect(result.name).toBe('Supplier');
      expect(result.color).toBe('#ABCDEF');
      expect(result.isPredefined).toBe(false);
      expect(result.id).toBeDefined();
    });

    it('handles optional fields with defaults and auto-generates color', async () => {
      // Mock query for getContactCategories (called by generateCategoryColor)
      vi.mocked(query).mockResolvedValue([]);
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      const input = { name: 'Basic' };

      const result = await createContactCategory(input);

      expect(result.name).toBe('Basic');
      // Color should be auto-generated (not null)
      expect(result.color).not.toBeNull();
      expect(result.color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(result.isPredefined).toBe(false);
    });
  });

  describe('updateContactCategory', () => {
    it('updates specific fields', async () => {
      const existingCategory = {
        id: 'cat-1',
        name: 'Old Name',
        color: '#000000',
        is_predefined: 0,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      const updatedCategory = {
        ...existingCategory,
        name: 'New Name',
        color: '#FFFFFF',
        updated_at: '2024-01-02T00:00:00.000Z',
      };

      vi.mocked(query)
        .mockResolvedValueOnce([existingCategory]) // getContactCategory check
        .mockResolvedValueOnce([updatedCategory]); // getContactCategory after update

      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      const result = await updateContactCategory('cat-1', { name: 'New Name', color: '#FFFFFF' });

      expect(execute).toHaveBeenCalled();
      const executeCall = vi.mocked(execute).mock.calls[0];
      expect(executeCall[0]).toContain('UPDATE contact_categories SET');
      expect(executeCall[0]).toContain('name = ?');
      expect(executeCall[0]).toContain('color = ?');
      expect(result?.name).toBe('New Name');
    });

    it('returns existing category if no updates provided', async () => {
      const existingCategory = {
        id: 'cat-1',
        name: 'Existing',
        color: '#123456',
        is_predefined: 0,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(query).mockResolvedValue([existingCategory]);

      const result = await updateContactCategory('cat-1', {});

      expect(execute).not.toHaveBeenCalled();
      expect(result?.name).toBe('Existing');
    });

    it('returns null when category not found', async () => {
      vi.mocked(query).mockResolvedValue([]);

      const result = await updateContactCategory('nonexistent', { name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('deleteContactCategory', () => {
    it('deletes a custom category and returns true', async () => {
      const customCategory = {
        id: 'cat-1',
        name: 'Custom',
        color: '#000000',
        is_predefined: 0,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(query).mockResolvedValue([customCategory]);
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      const result = await deleteContactCategory('cat-1');

      expect(execute).toHaveBeenCalledWith(
        'DELETE FROM contact_categories WHERE id = ?',
        ['cat-1']
      );
      expect(result).toBe(true);
    });

    it('returns false when trying to delete predefined category', async () => {
      const predefinedCategory = {
        id: 'cat-1',
        name: 'Client',
        color: '#3B82F6',
        is_predefined: 1,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(query).mockResolvedValue([predefinedCategory]);

      const result = await deleteContactCategory('cat-1');

      expect(execute).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('returns false when category not found', async () => {
      vi.mocked(query).mockResolvedValue([]);

      const result = await deleteContactCategory('nonexistent');

      expect(result).toBe(false);
    });
  });
});

// ============================================
// CONTACTS TESTS
// ============================================

describe('Contacts Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockContactRow = {
    id: 'contact-1',
    name: 'John Doe',
    phone_primary: '555-1234',
    phone_secondary: null,
    email: 'john@example.com',
    address_line1: '123 Main St',
    address_line2: null,
    city: 'Springfield',
    state: 'IL',
    postal_code: '62701',
    facebook: null,
    instagram: '@johndoe',
    tiktok: null,
    twitter: null,
    website: 'https://johndoe.com',
    notes: 'VIP customer',
    business_card_document_id: null,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };

  describe('getContacts', () => {
    it('queries all contacts ordered by name with categories', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce([mockContactRow]) // getContacts query
        .mockResolvedValueOnce([]); // getCategoriesForContact

      const result = await getContacts();

      expect(query).toHaveBeenCalledWith('SELECT * FROM contacts ORDER BY name');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
      expect(result[0].categories).toEqual([]);
    });

    it('returns contacts with their categories', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Client',
        color: '#3B82F6',
        is_predefined: 1,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(query)
        .mockResolvedValueOnce([mockContactRow])
        .mockResolvedValueOnce([mockCategory]);

      const result = await getContacts();

      expect(result[0].categories).toHaveLength(1);
      expect(result[0].categories[0].name).toBe('Client');
    });

    it('returns empty array when no contacts exist', async () => {
      vi.mocked(query).mockResolvedValue([]);

      const result = await getContacts();

      expect(result).toEqual([]);
    });
  });

  describe('getContact', () => {
    it('fetches a single contact by ID with categories', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Vet',
        color: '#EF4444',
        is_predefined: 1,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(query)
        .mockResolvedValueOnce([mockContactRow])
        .mockResolvedValueOnce([mockCategory]);

      const result = await getContact('contact-1');

      expect(query).toHaveBeenCalledWith('SELECT * FROM contacts WHERE id = ?', ['contact-1']);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('John Doe');
      expect(result?.phonePrimary).toBe('555-1234');
      expect(result?.email).toBe('john@example.com');
      expect(result?.categories).toHaveLength(1);
      expect(result?.categories[0].name).toBe('Vet');
    });

    it('returns null when contact is not found', async () => {
      vi.mocked(query).mockResolvedValue([]);

      const result = await getContact('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getContactsByCategory', () => {
    it('fetches contacts by category ID', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce([mockContactRow])
        .mockResolvedValueOnce([]);

      const result = await getContactsByCategory('cat-1');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INNER JOIN contact_category_links'),
        ['cat-1']
      );
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
    });

    it('returns empty array when no contacts in category', async () => {
      vi.mocked(query).mockResolvedValue([]);

      const result = await getContactsByCategory('empty-cat');

      expect(result).toEqual([]);
    });
  });

  describe('createContact', () => {
    it('inserts a new contact with all required fields', async () => {
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });
      vi.mocked(query)
        .mockResolvedValueOnce([mockContactRow])
        .mockResolvedValueOnce([]);

      const input = {
        name: 'John Doe',
        phonePrimary: '555-1234',
        email: 'john@example.com',
      };

      const result = await createContact(input);

      expect(execute).toHaveBeenCalled();
      const executeCall = vi.mocked(execute).mock.calls[0];
      expect(executeCall[0]).toContain('INSERT INTO contacts');
      expect(result.name).toBe('John Doe');
    });

    it('handles contact creation with category IDs', async () => {
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      const mockCategory = {
        id: 'cat-1',
        name: 'Client',
        color: '#3B82F6',
        is_predefined: 1,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(query)
        .mockResolvedValueOnce([mockContactRow])
        .mockResolvedValueOnce([mockCategory]);

      const input = {
        name: 'John Doe',
        categoryIds: ['cat-1'],
      };

      const result = await createContact(input);

      // Should call execute for contact insert and category links
      expect(execute).toHaveBeenCalled();
      expect(result.name).toBe('John Doe');
    });

    it('handles all optional fields', async () => {
      const fullContactRow = {
        ...mockContactRow,
        phone_secondary: '555-5678',
        address_line2: 'Suite 100',
        facebook: 'johndoe',
        tiktok: '@johndoe',
        twitter: '@johndoe',
      };

      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });
      vi.mocked(query)
        .mockResolvedValueOnce([fullContactRow])
        .mockResolvedValueOnce([]);

      const input = {
        name: 'John Doe',
        phonePrimary: '555-1234',
        phoneSecondary: '555-5678',
        email: 'john@example.com',
        addressLine1: '123 Main St',
        addressLine2: 'Suite 100',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62701',
        facebook: 'johndoe',
        instagram: '@johndoe',
        tiktok: '@johndoe',
        twitter: '@johndoe',
        website: 'https://johndoe.com',
        notes: 'VIP customer',
      };

      const result = await createContact(input);

      expect(result.phonePrimary).toBe('555-1234');
      expect(result.city).toBe('Springfield');
    });
  });

  describe('updateContact', () => {
    it('updates specific fields', async () => {
      const updatedContactRow = {
        ...mockContactRow,
        name: 'Jane Doe',
        email: 'jane@example.com',
      };

      vi.mocked(query)
        .mockResolvedValueOnce([mockContactRow])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([updatedContactRow])
        .mockResolvedValueOnce([]);

      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      const result = await updateContact('contact-1', { name: 'Jane Doe', email: 'jane@example.com' });

      expect(execute).toHaveBeenCalled();
      const executeCall = vi.mocked(execute).mock.calls[0];
      expect(executeCall[0]).toContain('UPDATE contacts SET');
      expect(executeCall[0]).toContain('name = ?');
      expect(executeCall[0]).toContain('email = ?');
      expect(result?.name).toBe('Jane Doe');
      expect(result?.email).toBe('jane@example.com');
    });

    it('updates categories when categoryIds provided', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce([mockContactRow])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockContactRow])
        .mockResolvedValueOnce([]);

      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      const result = await updateContact('contact-1', { categoryIds: ['cat-1', 'cat-2'] });

      // Should call execute for category link updates
      expect(execute).toHaveBeenCalled();
      expect(result).not.toBeNull();
    });

    it('returns null when contact not found', async () => {
      vi.mocked(query).mockResolvedValue([]);

      const result = await updateContact('nonexistent', { name: 'Test' });

      expect(result).toBeNull();
    });

    it('returns current contact if no updates provided', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce([mockContactRow])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockContactRow])
        .mockResolvedValueOnce([]);

      const result = await updateContact('contact-1', {});

      // execute should not be called for the main update (only potential category update)
      expect(result?.name).toBe('John Doe');
    });
  });

  describe('deleteContact', () => {
    it('deletes a contact and returns true', async () => {
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      const result = await deleteContact('contact-1');

      expect(execute).toHaveBeenCalledWith('DELETE FROM contacts WHERE id = ?', ['contact-1']);
      expect(result).toBe(true);
    });

    it('returns false when contact not found', async () => {
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 0 });

      const result = await deleteContact('nonexistent');

      expect(result).toBe(false);
    });
  });
});

// ============================================
// CONTACT-CATEGORY LINKS TESTS
// ============================================

describe('Contact-Category Links Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCategoriesForContact', () => {
    it('fetches categories for a contact with join', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Client',
          color: '#3B82F6',
          is_predefined: 1,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'cat-2',
          name: 'Breeder',
          color: '#10B981',
          is_predefined: 1,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      ];

      vi.mocked(query).mockResolvedValue(mockCategories);

      const result = await getCategoriesForContact('contact-1');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INNER JOIN contact_category_links'),
        ['contact-1']
      );
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Client');
      expect(result[1].name).toBe('Breeder');
    });

    it('returns empty array when contact has no categories', async () => {
      vi.mocked(query).mockResolvedValue([]);

      const result = await getCategoriesForContact('contact-1');

      expect(result).toEqual([]);
    });
  });

  describe('setContactCategories', () => {
    it('replaces existing categories with new ones', async () => {
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      await setContactCategories('contact-1', ['cat-1', 'cat-2']);

      // First call should delete existing links
      expect(execute).toHaveBeenCalledWith(
        'DELETE FROM contact_category_links WHERE contact_id = ?',
        ['contact-1']
      );

      // Subsequent calls should insert new links
      expect(execute).toHaveBeenCalledTimes(3); // 1 delete + 2 inserts
    });

    it('handles empty category array (removes all categories)', async () => {
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      await setContactCategories('contact-1', []);

      expect(execute).toHaveBeenCalledWith(
        'DELETE FROM contact_category_links WHERE contact_id = ?',
        ['contact-1']
      );
      expect(execute).toHaveBeenCalledTimes(1); // Only delete, no inserts
    });
  });

  describe('addCategoryToContact', () => {
    it('adds a category if link does not exist', async () => {
      vi.mocked(query).mockResolvedValue([]); // No existing link
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      await addCategoryToContact('contact-1', 'cat-1');

      expect(query).toHaveBeenCalledWith(
        'SELECT id FROM contact_category_links WHERE contact_id = ? AND category_id = ?',
        ['contact-1', 'cat-1']
      );
      expect(execute).toHaveBeenCalled();
      const executeCall = vi.mocked(execute).mock.calls[0];
      expect(executeCall[0]).toContain('INSERT INTO contact_category_links');
    });

    it('does not add duplicate link if already exists', async () => {
      vi.mocked(query).mockResolvedValue([{ id: 'existing-link' }]);

      await addCategoryToContact('contact-1', 'cat-1');

      expect(execute).not.toHaveBeenCalled();
    });
  });

  describe('removeCategoryFromContact', () => {
    it('removes the category link', async () => {
      vi.mocked(execute).mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });

      await removeCategoryFromContact('contact-1', 'cat-1');

      expect(execute).toHaveBeenCalledWith(
        'DELETE FROM contact_category_links WHERE contact_id = ? AND category_id = ?',
        ['contact-1', 'cat-1']
      );
    });
  });
});

// ============================================
// SEARCH TESTS
// ============================================

describe('Contact Search Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchContacts', () => {
    it('searches contacts by name, email, or phone', async () => {
      const mockContactRow = {
        id: 'contact-1',
        name: 'John Doe',
        phone_primary: '555-1234',
        phone_secondary: null,
        email: 'john@example.com',
        address_line1: null,
        address_line2: null,
        city: null,
        state: null,
        postal_code: null,
        facebook: null,
        instagram: null,
        tiktok: null,
        twitter: null,
        website: null,
        notes: null,
        business_card_document_id: null,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(query)
        .mockResolvedValueOnce([mockContactRow])
        .mockResolvedValueOnce([]);

      const result = await searchContacts('john');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE name LIKE ?'),
        ['%john%', '%john%', '%john%', '%john%', '%john%']
      );
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
    });

    it('returns empty array when no matches found', async () => {
      vi.mocked(query).mockResolvedValue([]);

      const result = await searchContacts('nonexistent');

      expect(result).toEqual([]);
    });

    it('returns contacts with categories in search results', async () => {
      const mockContactRow = {
        id: 'contact-1',
        name: 'Jane Smith',
        phone_primary: '555-9999',
        phone_secondary: null,
        email: 'jane@example.com',
        address_line1: null,
        address_line2: null,
        city: null,
        state: null,
        postal_code: null,
        facebook: null,
        instagram: null,
        tiktok: null,
        twitter: null,
        website: null,
        notes: null,
        business_card_document_id: null,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      const mockCategory = {
        id: 'cat-1',
        name: 'Client',
        color: '#3B82F6',
        is_predefined: 1,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(query)
        .mockResolvedValueOnce([mockContactRow])
        .mockResolvedValueOnce([mockCategory]);

      const result = await searchContacts('jane');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Jane Smith');
      expect(result[0].categories).toHaveLength(1);
      expect(result[0].categories[0].name).toBe('Client');
    });
  });
});
