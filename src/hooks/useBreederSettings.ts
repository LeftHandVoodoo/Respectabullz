import { useSettings, useUpdateSetting } from './useSettings';
import type { BreederSettings } from '@/types';

// Setting keys for breeder information
const BREEDER_SETTING_KEYS = {
  kennelName: 'breeder.kennelName',
  breederName: 'breeder.breederName',
  addressLine1: 'breeder.addressLine1',
  addressLine2: 'breeder.addressLine2',
  city: 'breeder.city',
  state: 'breeder.state',
  postalCode: 'breeder.postalCode',
  phone: 'breeder.phone',
  email: 'breeder.email',
  kennelRegistration: 'breeder.kennelRegistration',
  kennelPrefix: 'breeder.kennelPrefix',
  county: 'breeder.county',
} as const;

// Default values for breeder settings
const DEFAULT_BREEDER_SETTINGS: BreederSettings = {
  kennelName: 'Respectabullz',
  breederName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  phone: '',
  email: '',
  kennelRegistration: '',
  kennelPrefix: '',
  county: '',
};

/**
 * Hook to manage breeder settings as a structured object.
 * Provides typed getters and setters for all breeder fields.
 */
export function useBreederSettings() {
  const { data: settings, isLoading } = useSettings();
  const updateSetting = useUpdateSetting();

  // Build breeder settings object from individual settings
  const breederSettings: BreederSettings = {
    kennelName: settings?.[BREEDER_SETTING_KEYS.kennelName] || DEFAULT_BREEDER_SETTINGS.kennelName,
    breederName: settings?.[BREEDER_SETTING_KEYS.breederName] || DEFAULT_BREEDER_SETTINGS.breederName,
    addressLine1: settings?.[BREEDER_SETTING_KEYS.addressLine1] || DEFAULT_BREEDER_SETTINGS.addressLine1,
    addressLine2: settings?.[BREEDER_SETTING_KEYS.addressLine2] || DEFAULT_BREEDER_SETTINGS.addressLine2,
    city: settings?.[BREEDER_SETTING_KEYS.city] || DEFAULT_BREEDER_SETTINGS.city,
    state: settings?.[BREEDER_SETTING_KEYS.state] || DEFAULT_BREEDER_SETTINGS.state,
    postalCode: settings?.[BREEDER_SETTING_KEYS.postalCode] || DEFAULT_BREEDER_SETTINGS.postalCode,
    phone: settings?.[BREEDER_SETTING_KEYS.phone] || DEFAULT_BREEDER_SETTINGS.phone,
    email: settings?.[BREEDER_SETTING_KEYS.email] || DEFAULT_BREEDER_SETTINGS.email,
    kennelRegistration: settings?.[BREEDER_SETTING_KEYS.kennelRegistration] || DEFAULT_BREEDER_SETTINGS.kennelRegistration,
    kennelPrefix: settings?.[BREEDER_SETTING_KEYS.kennelPrefix] || DEFAULT_BREEDER_SETTINGS.kennelPrefix,
    county: settings?.[BREEDER_SETTING_KEYS.county] || DEFAULT_BREEDER_SETTINGS.county,
  };

  // Check if required breeder settings are configured
  const isConfigured = Boolean(
    breederSettings.breederName &&
    breederSettings.addressLine1 &&
    breederSettings.city &&
    breederSettings.state &&
    breederSettings.phone
  );

  // Update a single breeder setting
  const updateBreederSetting = (key: keyof BreederSettings, value: string) => {
    const settingKey = BREEDER_SETTING_KEYS[key];
    updateSetting.mutate({ key: settingKey, value });
  };

  // Update multiple breeder settings at once
  const updateBreederSettings = async (updates: Partial<BreederSettings>) => {
    const promises = Object.entries(updates).map(([key, value]) => {
      const settingKey = BREEDER_SETTING_KEYS[key as keyof BreederSettings];
      return updateSetting.mutateAsync({ key: settingKey, value: value || '' });
    });
    await Promise.all(promises);
  };

  return {
    breederSettings,
    isLoading,
    isConfigured,
    updateBreederSetting,
    updateBreederSettings,
    isPending: updateSetting.isPending,
  };
}

export { BREEDER_SETTING_KEYS, DEFAULT_BREEDER_SETTINGS };

