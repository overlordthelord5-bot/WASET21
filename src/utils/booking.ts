import { AvailabilityRule, Booking } from '../types';

export interface AvailableSlot {
  slotStart: string; // ISO String
  slotEnd: string; // ISO String
  displayTime: string; // e.g. "02:00 PM"
  displayDate: string; // e.g. "2026-11-15"
  dayOfWeek: number;
}

/**
 * Checks whether two time intervals overlap.
 * [startA, endA] and [startB, endB]
 */
export function doIntervalsOverlap(
  startA: Date | number,
  endA: Date | number,
  startB: Date | number,
  endB: Date | number
): boolean {
  const sA = typeof startA === 'number' ? startA : startA.getTime();
  const eA = typeof endA === 'number' ? endA : endA.getTime();
  const sB = typeof startB === 'number' ? startB : startB.getTime();
  const eB = typeof endB === 'number' ? endB : endB.getTime();

  return Math.max(sA, sB) < Math.min(eA, eB);
}

/**
 * Validates whether a proposed booking slot conflicts with any existing confirmed/in-progress booking.
 */
export function hasBookingConflict(
  proposedStartIso: string,
  durationMinutes: number,
  existingBookings: Booking[],
  consultantId: string
): { hasConflict: boolean; conflictingBooking?: Booking } {
  const proposedStart = new Date(proposedStartIso).getTime();
  const proposedEnd = proposedStart + durationMinutes * 60 * 1000;

  for (const booking of existingBookings) {
    if (booking.consultantId !== consultantId) continue;
    // Only check active or confirmed bookings
    if (['pending', 'confirmed', 'in_progress'].includes(booking.status)) {
      const existingStart = new Date(booking.scheduledAt).getTime();
      const existingEnd = existingStart + booking.durationMinutes * 60 * 1000;

      if (doIntervalsOverlap(proposedStart, proposedEnd, existingStart, existingEnd)) {
        return {
          hasConflict: true,
          conflictingBooking: booking,
        };
      }
    }
  }

  return { hasConflict: false };
}

/**
 * Generates available appointment slots for a consultant across the future window,
 * taking into account working hours, session duration, buffer time, advance notice, and existing bookings.
 */
export function generateAvailableSlots(
  rules: AvailabilityRule[],
  existingBookings: Booking[],
  consultantId: string,
  now: Date = new Date(),
  maxDaysAhead: number = 7
): AvailableSlot[] {
  const slots: AvailableSlot[] = [];
  const consultantRules = rules.filter((r) => r.consultantId === consultantId && r.isActive);

  if (consultantRules.length === 0) {
    return slots;
  }

  for (let dayOffset = 0; dayOffset < maxDaysAhead; dayOffset++) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + dayOffset);
    const dayOfWeek = targetDate.getDay();

    const dayRules = consultantRules.filter((r) => r.dayOfWeek === dayOfWeek);
    for (const rule of dayRules) {
      const [startHour, startMin] = rule.startTime.split(':').map(Number);
      const [endHour, endMin] = rule.endTime.split(':').map(Number);

      const dayStart = new Date(targetDate);
      dayStart.setHours(startHour, startMin, 0, 0);

      const dayEnd = new Date(targetDate);
      dayEnd.setHours(endHour, endMin, 0, 0);

      let currentSlotStart = new Date(dayStart);
      const sessionMs = rule.sessionDurationMinutes * 60 * 1000;
      const bufferMs = rule.bufferMinutes * 60 * 1000;
      const advanceNoticeMs = rule.advanceNoticeHours * 60 * 60 * 1000;

      while (currentSlotStart.getTime() + sessionMs <= dayEnd.getTime()) {
        const currentSlotEnd = new Date(currentSlotStart.getTime() + sessionMs);

        // Check advance notice rule: must be at least advanceNoticeHours from now
        if (currentSlotStart.getTime() >= now.getTime() + advanceNoticeMs) {
          // Check if slot conflicts with any existing booking
          const conflict = hasBookingConflict(
            currentSlotStart.toISOString(),
            rule.sessionDurationMinutes,
            existingBookings,
            consultantId
          );

          if (!conflict.hasConflict) {
            slots.push({
              slotStart: currentSlotStart.toISOString(),
              slotEnd: currentSlotEnd.toISOString(),
              displayTime: currentSlotStart.toLocaleTimeString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Africa/Cairo',
              }),
              displayDate: currentSlotStart.toLocaleDateString('ar-EG', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                timeZone: 'Africa/Cairo',
              }),
              dayOfWeek,
            });
          }
        }

        // Advance to next slot including buffer time
        currentSlotStart = new Date(currentSlotEnd.getTime() + bufferMs);
      }
    }
  }

  return slots;
}
