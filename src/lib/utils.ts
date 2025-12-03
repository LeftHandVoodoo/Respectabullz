import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  // Check for invalid date
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatWeight(lbs: number, unit: 'lbs' | 'kg' = 'lbs'): string {
  if (unit === 'kg') {
    const kg = lbs * 0.453592;
    return `${kg.toFixed(1)} kg`;
  }
  return `${lbs.toFixed(1)} lbs`;
}

export function calculateAge(birthDate: Date | string): string {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  // Check for invalid date
  if (isNaN(birth.getTime())) return 'Invalid date';
  
  const now = new Date();
  
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  
  // Adjust if we haven't reached the birth day this month yet
  if (now.getDate() < birth.getDate()) {
    months--;
  }
  
  // Adjust if months are negative
  if (months < 0) {
    years--;
    months += 12;
  }
  
  const totalMonths = years * 12 + months;
  
  if (totalMonths < 1) {
    const days = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return '0 days';
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
  
  if (totalMonths < 12) {
    return `${totalMonths} month${totalMonths !== 1 ? 's' : ''}`;
  }
  
  const displayYears = Math.floor(totalMonths / 12);
  const displayMonths = totalMonths % 12;
  
  if (displayMonths === 0) {
    return `${displayYears} year${displayYears !== 1 ? 's' : ''}`;
  }
  
  return `${displayYears}y ${displayMonths}m`;
}

export function generateLitterCode(breedingDate: Date): string {
  const year = breedingDate.getFullYear();
  const month = String(breedingDate.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${year}-${month}-${random}`;
}

