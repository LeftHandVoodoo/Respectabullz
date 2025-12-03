import { useMemo } from 'react';
import { useVaccinations } from './useHealth';
import { useLitters } from './useLitters';
import { formatDate } from '@/lib/utils';

export interface NotificationItem {
  id: string;
  type: 'vaccination_overdue' | 'vaccination_due_soon' | 'litter_due_soon';
  title: string;
  message: string;
  date?: Date;
  link?: string;
}

export function useNotifications() {
  const { data: vaccinations } = useVaccinations();
  const { data: litters } = useLitters();

  const notifications = useMemo(() => {
    const items: NotificationItem[] = [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Check vaccinations
    if (vaccinations) {
      vaccinations.forEach((vax) => {
        if (vax.nextDueDate) {
          const dueDate = new Date(vax.nextDueDate);
          const dogName = vax.dog?.name || 'Unknown';
          
          if (dueDate < now) {
            // Overdue
            items.push({
              id: `vax-overdue-${vax.id}`,
              type: 'vaccination_overdue',
              title: 'Vaccination Overdue',
              message: `${dogName} is overdue for ${vax.vaccineType}`,
              date: dueDate,
              link: `/dogs/${vax.dogId}`,
            });
          } else if (dueDate <= thirtyDaysFromNow) {
            // Due soon
            items.push({
              id: `vax-due-${vax.id}`,
              type: 'vaccination_due_soon',
              title: 'Vaccination Due Soon',
              message: `${dogName} is due for ${vax.vaccineType} on ${formatDate(dueDate)}`,
              date: dueDate,
              link: `/dogs/${vax.dogId}`,
            });
          }
        }
      });
    }

    // Check litters
    if (litters) {
      litters.forEach((litter) => {
        if (litter.dueDate && !litter.whelpDate) {
          const dueDate = new Date(litter.dueDate);
          if (dueDate <= thirtyDaysFromNow && dueDate >= now) {
            const damName = litter.dam?.name || 'Unknown';
            items.push({
              id: `litter-due-${litter.id}`,
              type: 'litter_due_soon',
              title: 'Litter Expected Soon',
              message: `Litter ${litter.code} (${damName}) is expected on ${formatDate(dueDate)}`,
              date: dueDate,
              link: `/litters/${litter.id}`,
            });
          }
        }
      });
    }

    // Sort by date (overdue first, then by date)
    return items.sort((a, b) => {
      if (a.type === 'vaccination_overdue' && b.type !== 'vaccination_overdue') return -1;
      if (b.type === 'vaccination_overdue' && a.type !== 'vaccination_overdue') return 1;
      if (a.date && b.date) {
        return a.date.getTime() - b.date.getTime();
      }
      return 0;
    });
  }, [vaccinations, litters]);

  return {
    notifications,
    count: notifications.length,
  };
}

