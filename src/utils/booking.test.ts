import test from 'node:test';
import assert from 'node:assert/strict';
import {
  doIntervalsOverlap,
  hasBookingConflict,
  generateAvailableSlots,
} from './booking';
import { AvailabilityRule, Booking } from '../types';

test('doIntervalsOverlap detects overlapping time periods correctly', () => {
  const t1 = new Date('2026-11-15T10:00:00Z').getTime();
  const t2 = new Date('2026-11-15T11:00:00Z').getTime();
  const t3 = new Date('2026-11-15T10:30:00Z').getTime();
  const t4 = new Date('2026-11-15T11:30:00Z').getTime();
  const t5 = new Date('2026-11-15T11:00:00Z').getTime();
  const t6 = new Date('2026-11-15T12:00:00Z').getTime();

  // Overlap
  assert.equal(doIntervalsOverlap(t1, t2, t3, t4), true);
  // Adjacent non-overlapping
  assert.equal(doIntervalsOverlap(t1, t2, t5, t6), false);
  // Completely separate
  assert.equal(doIntervalsOverlap(t1, t2, t2 + 3600000, t2 + 7200000), false);
});

test('hasBookingConflict prevents double booking for the same consultant', () => {
  const existingBookings: Booking[] = [
    {
      id: 'b-1',
      bookingNumber: 'WAS-BK-1001',
      clientId: 'u-1',
      clientName: 'أحمد محمود',
      consultantId: 'c-10',
      consultantName: 'د. طارق السعيد',
      serviceTitle: 'استشارة مالية',
      categoryId: 'cat-financial',
      deliveryMode: 'video',
      notes: '',
      priceEgp: 1000,
      platformFeeEgp: 150,
      netConsultantEgp: 850,
      status: 'confirmed',
      scheduledAt: '2026-11-15T14:00:00.000Z',
      durationMinutes: 60,
      paymentMethod: 'card_online',
      paymentStatus: 'held_in_escrow',
      isEscrowHeld: true,
      createdAt: '2026-11-10T10:00:00Z',
      updatedAt: '2026-11-10T10:00:00Z',
    },
  ];

  // Attempting to book during active slot
  const conflictResult = hasBookingConflict(
    '2026-11-15T14:30:00.000Z',
    45,
    existingBookings,
    'c-10'
  );
  assert.equal(conflictResult.hasConflict, true);
  assert.equal(conflictResult.conflictingBooking?.id, 'b-1');

  // Attempting to book a different time slot
  const noConflictResult = hasBookingConflict(
    '2026-11-15T16:00:00.000Z',
    45,
    existingBookings,
    'c-10'
  );
  assert.equal(noConflictResult.hasConflict, false);
});

test('generateAvailableSlots produces conflict-free slots with buffers', () => {
  const rules: AvailabilityRule[] = [
    {
      id: 'rule-1',
      consultantId: 'c-10',
      dayOfWeek: 1, // Monday
      startTime: '10:00',
      endTime: '12:00',
      sessionDurationMinutes: 45,
      bufferMinutes: 15,
      advanceNoticeHours: 1,
      futureWindowDays: 14,
      isActive: true,
    },
  ];

  const now = new Date('2026-11-15T08:00:00Z'); // Sunday
  const slots = generateAvailableSlots(rules, [], 'c-10', now, 5);

  assert.ok(slots.length > 0);
  assert.equal(slots[0].dayOfWeek, 1);
});
