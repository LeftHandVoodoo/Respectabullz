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
  } catch {
    // Running in browser, not Tauri
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


