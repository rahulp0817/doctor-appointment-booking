import { addMinutes, format, parse, isWithinInterval, startOfDay, addDays } from 'date-fns';
import { TimeSlot, CalendlyEvent, AppointmentType } from './types';

interface WorkingHours {
  start: string; // "09:00"
  end: string;   // "17:00"
}

const DEFAULT_WORKING_HOURS: WorkingHours = {
  start: '09:00',
  end: '17:00',
};

export function generateAvailableSlots(
  date: Date,
  duration: number,
  existingEvents: CalendlyEvent[],
  workingHours: WorkingHours = DEFAULT_WORKING_HOURS
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const dateStr = format(date, 'yyyy-MM-dd');
  
  // Parse working hours
  const startTime = parse(`${dateStr} ${workingHours.start}`, 'yyyy-MM-dd HH:mm', new Date());
  const endTime = parse(`${dateStr} ${workingHours.end}`, 'yyyy-MM-dd HH:mm', new Date());
  
  let currentTime = startTime;
  
  while (currentTime < endTime) {
    const slotEnd = addMinutes(currentTime, duration);
    
    // Check if slot end exceeds working hours
    if (slotEnd > endTime) break;
    
    // Check for conflicts with existing appointments
    const hasConflict = existingEvents.some(event => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);
      
      return (
        isWithinInterval(currentTime, { start: eventStart, end: eventEnd }) ||
        isWithinInterval(slotEnd, { start: eventStart, end: eventEnd }) ||
        (currentTime <= eventStart && slotEnd >= eventEnd)
      );
    });
    
    slots.push({
      start: currentTime.toISOString(),
      end: slotEnd.toISOString(),
      available: !hasConflict,
    });
    
    // Move to next slot (use duration as interval)
    currentTime = addMinutes(currentTime, duration);
  }
  
  return slots.filter(slot => slot.available);
}

export function getSlotRecommendations(
  slots: TimeSlot[],
  preferredTime?: string
): TimeSlot[] {
  // Add reasoning to slots
  const slotsWithReasons = slots.map(slot => {
    const hour = new Date(slot.start).getHours();
    let reason = '';
    
    if (hour >= 9 && hour < 12) {
      reason = 'Morning slot - Fresh start, less waiting time';
    } else if (hour >= 12 && hour < 14) {
      reason = 'Midday slot - Convenient timing';
    } else if (hour >= 14 && hour < 17) {
      reason = 'Afternoon slot - Relaxed schedule';
    }
    
    return { ...slot, reason };
  });
  
  // If preferred time, prioritize those
  if (preferredTime) {
    const preferredHour = parseInt(preferredTime.split(':')[0]);
    slotsWithReasons.sort((a, b) => {
      const aHour = new Date(a.start).getHours();
      const bHour = new Date(b.start).getHours();
      return Math.abs(aHour - preferredHour) - Math.abs(bHour - preferredHour);
    });
  }
  
  // Return top 5 slots
  return slotsWithReasons.slice(0, 5);
}

export function getAlternativeDates(requestedDate: Date, daysAhead: number = 7): Date[] {
  const alternatives: Date[] = [];
  const start = startOfDay(requestedDate);
  
  for (let i = 1; i <= daysAhead; i++) {
    alternatives.push(addDays(start, i));
  }
  
  return alternatives;
}