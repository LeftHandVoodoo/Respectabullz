// Settings database operations
// Handles user settings and breeder configuration

import { query, execute } from './connection';
import { generateId, nowIso } from './utils';
import type { Setting, BreederSettings } from '@/types';

// ============================================
// SETTINGS
// ============================================

interface SettingRow {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

function rowToSetting(row: SettingRow): Setting {
  return {
    id: row.id,
    key: row.key,
    value: row.value,
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Get a single setting by key
 */
export async function getSetting(key: string): Promise<string | null> {
  const rows = await query<SettingRow>('SELECT * FROM settings WHERE key = ?', [key]);
  return rows.length > 0 ? rows[0].value : null;
}

/**
 * Set a setting value (create or update)
 */
export async function setSetting(key: string, value: string): Promise<Setting> {
  const now = nowIso();
  
  // Try to update first
  const updateResult = await execute(
    'UPDATE settings SET value = ?, updated_at = ? WHERE key = ?',
    [value, now, key]
  );
  
  if (updateResult.rowsAffected === 0) {
    // Insert new setting
    const id = generateId();
    await execute(
      'INSERT INTO settings (id, key, value, updated_at) VALUES (?, ?, ?, ?)',
      [id, key, value, now]
    );
  }
  
  const rows = await query<SettingRow>('SELECT * FROM settings WHERE key = ?', [key]);
  if (rows.length === 0) {
    throw new Error(`Failed to set setting '${key}': record not found after upsert`);
  }
  return rowToSetting(rows[0]);
}

/**
 * Get all settings as a key-value object
 */
export async function getSettings(): Promise<Record<string, string>> {
  const rows = await query<SettingRow>('SELECT * FROM settings');
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

/**
 * Delete a setting
 */
export async function deleteSetting(key: string): Promise<boolean> {
  const result = await execute('DELETE FROM settings WHERE key = ?', [key]);
  return result.rowsAffected > 0;
}

// ============================================
// BREEDER SETTINGS
// ============================================

// Keys for breeder settings
const BREEDER_SETTINGS_KEYS = {
  kennelName: 'breeder_kennel_name',
  ownerName: 'breeder_owner_name',
  phone: 'breeder_phone',
  email: 'breeder_email',
  website: 'breeder_website',
  addressLine1: 'breeder_address_line1',
  addressLine2: 'breeder_address_line2',
  city: 'breeder_city',
  state: 'breeder_state',
  postalCode: 'breeder_postal_code',
  licenseNumber: 'breeder_license_number',
  logoPath: 'breeder_logo_path',
  defaultBreed: 'breeder_default_breed',
  registryMemberships: 'breeder_registry_memberships',
  contractTemplatePath: 'breeder_contract_template_path',
};

/**
 * Get breeder settings
 */
export async function getBreederSettings(): Promise<BreederSettings> {
  const settings = await getSettings();
  
  return {
    kennelName: settings[BREEDER_SETTINGS_KEYS.kennelName] ?? '',
    breederName: settings[BREEDER_SETTINGS_KEYS.ownerName] ?? '',
    phone: settings[BREEDER_SETTINGS_KEYS.phone] ?? '',
    email: settings[BREEDER_SETTINGS_KEYS.email] ?? '',
    addressLine1: settings[BREEDER_SETTINGS_KEYS.addressLine1] ?? '',
    addressLine2: settings[BREEDER_SETTINGS_KEYS.addressLine2] ?? '',
    city: settings[BREEDER_SETTINGS_KEYS.city] ?? '',
    state: settings[BREEDER_SETTINGS_KEYS.state] ?? '',
    postalCode: settings[BREEDER_SETTINGS_KEYS.postalCode] ?? '',
  };
}

/**
 * Save breeder settings
 */
export async function saveBreederSettings(input: Partial<BreederSettings>): Promise<BreederSettings> {
  if (input.kennelName !== undefined) await setSetting(BREEDER_SETTINGS_KEYS.kennelName, input.kennelName);
  if (input.breederName !== undefined) await setSetting(BREEDER_SETTINGS_KEYS.ownerName, input.breederName);
  if (input.phone !== undefined) await setSetting(BREEDER_SETTINGS_KEYS.phone, input.phone);
  if (input.email !== undefined) await setSetting(BREEDER_SETTINGS_KEYS.email, input.email);
  if (input.addressLine1 !== undefined) await setSetting(BREEDER_SETTINGS_KEYS.addressLine1, input.addressLine1);
  if (input.addressLine2 !== undefined) await setSetting(BREEDER_SETTINGS_KEYS.addressLine2, input.addressLine2);
  if (input.city !== undefined) await setSetting(BREEDER_SETTINGS_KEYS.city, input.city);
  if (input.state !== undefined) await setSetting(BREEDER_SETTINGS_KEYS.state, input.state);
  if (input.postalCode !== undefined) await setSetting(BREEDER_SETTINGS_KEYS.postalCode, input.postalCode);
  
  return getBreederSettings();
}

/**
 * Check if first launch (no kennel name set)
 */
export async function isFirstLaunch(): Promise<boolean> {
  const kennelName = await getSetting(BREEDER_SETTINGS_KEYS.kennelName);
  return !kennelName || kennelName.trim() === '';
}

