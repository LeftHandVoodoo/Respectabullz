// Notification utilities for Tauri
// Uses Tauri's notification plugin for system notifications

import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
}

let permissionGranted = false;

export async function initNotifications(): Promise<boolean> {
  try {
    permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }
    return permissionGranted;
  } catch (error) {
    // Running in browser, not Tauri
    console.log('Notifications not available (browser mode)');
    return false;
  }
}

export async function showNotification(options: NotificationOptions): Promise<void> {
  if (!permissionGranted) {
    await initNotifications();
  }

  if (permissionGranted) {
    try {
      sendNotification(options);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }
}

// Reminder notification helpers
export function notifyVaccinationDue(dogName: string, vaccineType: string): void {
  showNotification({
    title: 'Vaccination Reminder',
    body: `${dogName} is due for ${vaccineType} vaccination`,
  });
}

export function notifyLitterDue(litterCode: string, damName: string): void {
  showNotification({
    title: 'Litter Due Date',
    body: `Litter ${litterCode} (${damName}) is due soon`,
  });
}

export function notifyHeatCycleStart(bitchName: string): void {
  showNotification({
    title: 'Heat Cycle Alert',
    body: `${bitchName} appears to be starting a heat cycle`,
  });
}

