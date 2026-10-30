import { describe, expect, it } from 'vitest';
import {
  canExtendBooking,
  checkEligibility,
  checkWeeklyCap,
  computeFairShareScore,
  detectConflict,
  detectSuspiciousPatterns,
  getRolling7DayUsageHours,
  isBookingOverdue,
  orderWaitlist,
  promoteTopWaitlist,
} from '../src/lib/domain';
import { Booking, Profile, Resource, UserQualification } from '../src/types';

const mockProfileUser: Profile = {
  id: '11111111-1111-1111-1111-111111111111',
  full_name: 'Aarav Patel',
  email: 'aarav@campus.edu',
  role: 'user',
  department: 'ECE',
  id_number: 'STU-ECE-2024-01',
  trust_score: 85,
  late_count: 0,
  late_cancel_count: 0,
  damage_count: 0,
  owner_verified: false,
  created_at: new Date().toISOString(),
};

const mockResource3DPrinter: Resource = {
  id: 'res-3d-printer',
  owner_id: 'owner-dr-mehta',
  name: 'Stratasys 3D Printer',
  category: 'makerspace',
  description: 'High precision industrial printer',
  location: 'Bay 3',
  photos: [],
  open_hour: 8,
  close_hour: 20,
  available_days: [1, 2, 3, 4, 5, 6], // Mon-Sat
  blackout_dates: ['2026-11-20'],
  max_hours_per_booking: 4,
  required_qualification_id: 'qual-3d-cert',
  department_restriction: null,
  supervision_required: false,
  status: 'available',
  keywords: ['3d print', 'cad'],
};

const mockResourceECEBench: Resource = {
  id: 'res-ece-bench',
  owner_id: 'owner-prof-rao',
  name: 'FPGA Development Bench',
  category: 'labs',
  description: 'Zynq FPGA station',
  location: 'Room 204',
  photos: [],
  open_hour: 8,
  close_hour: 20,
  available_days: [1, 2, 3, 4, 5],
  blackout_dates: [],
  max_hours_per_booking: 4,
  required_qualification_id: null,
  department_restriction: 'ECE',
  supervision_required: false,
  status: 'available',
  keywords: ['fpga', 'ece'],
};

describe('Eligibility Engine', () => {
  it('approves eligible student with verified qualification within schedule', () => {
    // 2 hours tomorrow at 10:00 (Tuesday)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    // ensure tomorrow is between Mon-Fri for test determinism
    while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
      tomorrow.setDate(tomorrow.getDate() + 1);
    }
    const end = new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000);

    const userQualifications: UserQualification[] = [
      {
        id: 'uq-1',
        user_id: mockProfileUser.id,
        qualification_id: 'qual-3d-cert',
        status: 'verified',
      },
    ];

    const result = checkEligibility({
      resource: mockResource3DPrinter,
      user: mockProfileUser,
      userQualifications,
      requestedStart: tomorrow,
      requestedEnd: end,
      userBookings: [],
    });

    expect(result.isEligible).toBe(true);
    expect(result.checks.every((c) => c.ok)).toBe(true);
  });

  it('rejects booking when safety qualification is missing or pending', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(11, 0, 0, 0);
    const end = new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000);

    const resultWithoutQual = checkEligibility({
      resource: mockResource3DPrinter,
      user: mockProfileUser,
      userQualifications: [], // no qualification
      requestedStart: tomorrow,
      requestedEnd: end,
    });

    expect(resultWithoutQual.isEligible).toBe(false);
    const qualCheck = resultWithoutQual.checks.find((c) => c.label === 'Safety Certification');
    expect(qualCheck?.ok).toBe(false);
  });

  it('enforces department restrictions correctly', () => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1);
    while (targetDate.getDay() === 0 || targetDate.getDay() === 6) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    targetDate.setHours(10, 0, 0, 0);
    const end = new Date(targetDate.getTime() + 2 * 60 * 60 * 1000);

    // ECE student passes ECE-restricted bench
    const eceResult = checkEligibility({
      resource: mockResourceECEBench,
      user: mockProfileUser, // department: 'ECE'
      requestedStart: targetDate,
      requestedEnd: end,
    });
    expect(eceResult.isEligible).toBe(true);

    // CSE student fails ECE-restricted bench
    const cseUser: Profile = {
      ...mockProfileUser,
      id: '22222222-2222-2222-2222-222222222222',
      department: 'CSE',
    };
    const cseResult = checkEligibility({
      resource: mockResourceECEBench,
      user: cseUser,
      requestedStart: targetDate,
      requestedEnd: end,
    });
    expect(cseResult.isEligible).toBe(false);
    expect(cseResult.checks.find((c) => c.label === 'Department Access')?.ok).toBe(false);
  });

  it('rejects requests outside operating hours and exceeding max duration', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(22, 0, 0, 0); // closed at 20:00
    const end = new Date(tomorrow.getTime() + 5 * 60 * 60 * 1000); // 5h > max 4h

    const result = checkEligibility({
      resource: mockResource3DPrinter,
      user: mockProfileUser,
      requestedStart: tomorrow,
      requestedEnd: end,
    });

    expect(result.isEligible).toBe(false);
    expect(result.checks.find((c) => c.label === 'Operating Schedule')?.ok).toBe(false);
    expect(result.checks.find((c) => c.label === 'Session Duration')?.ok).toBe(false);
  });
});

describe('Weekly Fair-Use Cap (8 Hours Rolling 7-Day Window)', () => {
  it('correctly tallies rolling 7-day usage and blocks requests over cap', () => {
    const now = new Date();
    const pastBookings: Booking[] = [
      {
        id: 'b-past-1',
        resource_id: mockResource3DPrinter.id,
        user_id: mockProfileUser.id,
        start_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        end_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
        purpose: 'Research run 1',
        status: 'returned',
        is_overdue: false,
        extension_requested: false,
        created_at: now.toISOString(),
      },
      {
        id: 'b-past-2',
        resource_id: mockResource3DPrinter.id,
        user_id: mockProfileUser.id,
        start_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        end_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        purpose: 'Research run 2',
        status: 'returned',
        is_overdue: false,
        extension_requested: false,
        created_at: now.toISOString(),
      },
    ];

    // Total used = 4 + 3 = 7 hours
    const usage = getRolling7DayUsageHours(pastBookings, now, mockResource3DPrinter.id);
    expect(usage).toBe(7);

    // Requesting 1 hour should be allowed (7 + 1 = 8 <= 8)
    const capOk = checkWeeklyCap(pastBookings, 1, 8, now, mockResource3DPrinter.id);
    expect(capOk.allowed).toBe(true);
    expect(capOk.remainingHours).toBe(1);

    // Requesting 2 hours should be blocked (7 + 2 = 9 > 8)
    const capBlocked = checkWeeklyCap(pastBookings, 2, 8, now, mockResource3DPrinter.id);
    expect(capBlocked.allowed).toBe(false);
  });
});

describe('Fair-Share Score & Waitlist Ordering', () => {
  it('computes fair-share score: hours + 2*late_returns + 1*late_cancels', () => {
    const userA: Profile = {
      ...mockProfileUser,
      id: 'user-a',
      late_count: 1, // 1 late return -> +2
      late_cancel_count: 2, // 2 late cancels -> +2
    };

    const bookingsA: Booking[] = [
      {
        id: 'b-1',
        resource_id: 'res-1',
        user_id: 'user-a',
        start_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        end_at: new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString(), // 3 hours
        purpose: 'Work',
        status: 'returned',
        is_overdue: false,
        extension_requested: false,
        created_at: new Date().toISOString(),
      },
    ];

    // Score = 3 hours + (2 * 1) + (1 * 2) = 7
    const result = computeFairShareScore(userA, bookingsA);
    expect(result.score).toBe(7);
    expect(result.breakdown.hoursUsed7d).toBe(3);
    expect(result.breakdown.lateCount).toBe(1);
    expect(result.breakdown.lateCancelCount).toBe(2);
  });

  it('orders waitlist with lower score first, tie-breaking by earlier request time', () => {
    const waitlist = [
      {
        id: 'w-high-score',
        resource_id: 'res-1',
        user_id: 'user-high',
        start_at: new Date().toISOString(),
        end_at: new Date().toISOString(),
        purpose: 'Test',
        status: 'waitlisted' as const,
        is_overdue: false,
        extension_requested: false,
        created_at: '2026-10-01T10:00:00Z',
        fair_share_score: 9.5,
      },
      {
        id: 'w-low-score',
        resource_id: 'res-1',
        user_id: 'user-low',
        start_at: new Date().toISOString(),
        end_at: new Date().toISOString(),
        purpose: 'Test',
        status: 'waitlisted' as const,
        is_overdue: false,
        extension_requested: false,
        created_at: '2026-10-01T12:00:00Z',
        fair_share_score: 1.0,
      },
      {
        id: 'w-tied-score-earlier',
        resource_id: 'res-1',
        user_id: 'user-tie-1',
        start_at: new Date().toISOString(),
        end_at: new Date().toISOString(),
        purpose: 'Test',
        status: 'waitlisted' as const,
        is_overdue: false,
        extension_requested: false,
        created_at: '2026-10-01T08:00:00Z',
        fair_share_score: 4.0,
      },
      {
        id: 'w-tied-score-later',
        resource_id: 'res-1',
        user_id: 'user-tie-2',
        start_at: new Date().toISOString(),
        end_at: new Date().toISOString(),
        purpose: 'Test',
        status: 'waitlisted' as const,
        is_overdue: false,
        extension_requested: false,
        created_at: '2026-10-01T09:00:00Z',
        fair_share_score: 4.0,
      },
    ];

    const sorted = orderWaitlist(waitlist);
    expect(sorted[0].id).toBe('w-low-score'); // 1.0 score
    expect(sorted[1].id).toBe('w-tied-score-earlier'); // 4.0 score, earlier created
    expect(sorted[2].id).toBe('w-tied-score-later'); // 4.0 score, later created
    expect(sorted[3].id).toBe('w-high-score'); // 9.5 score
  });

  it('auto-promotes top waitlisted booking to pending when prior booking cancels', () => {
    const waitlist = [
      {
        id: 'wait-top',
        resource_id: 'res-1',
        user_id: 'user-top',
        start_at: new Date().toISOString(),
        end_at: new Date().toISOString(),
        purpose: 'Top priority',
        status: 'waitlisted' as const,
        is_overdue: false,
        extension_requested: false,
        created_at: '2026-10-01T10:00:00Z',
        fair_share_score: 0.5,
      },
      {
        id: 'wait-second',
        resource_id: 'res-1',
        user_id: 'user-second',
        start_at: new Date().toISOString(),
        end_at: new Date().toISOString(),
        purpose: 'Second priority',
        status: 'waitlisted' as const,
        is_overdue: false,
        extension_requested: false,
        created_at: '2026-10-01T11:00:00Z',
        fair_share_score: 3.5,
      },
    ];

    const { promotedBooking, remainingWaitlist } = promoteTopWaitlist(waitlist);
    expect(promotedBooking).not.toBeNull();
    expect(promotedBooking?.id).toBe('wait-top');
    expect(promotedBooking?.status).toBe('pending');
    expect(remainingWaitlist.length).toBe(1);
    expect(remainingWaitlist[0].id).toBe('wait-second');
  });
});

describe('Conflict Detection & Nearest Free Slots', () => {
  it('identifies time overlaps with approved bookings and suggests free slots', () => {
    const base = new Date();
    base.setDate(base.getDate() + 2);
    base.setHours(10, 0, 0, 0);

    const approvedBooking: Booking = {
      id: 'b-approved',
      resource_id: mockResource3DPrinter.id,
      user_id: 'other-user',
      start_at: new Date(base.getTime()).toISOString(),
      end_at: new Date(base.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 10:00 - 12:00
      purpose: 'Printing',
      status: 'approved',
      is_overdue: false,
      extension_requested: false,
      created_at: new Date().toISOString(),
    };

    // Candidate conflicts: 11:00 - 13:00 (overlaps 10:00 - 12:00)
    const candidateStart = new Date(base.getTime() + 1 * 60 * 60 * 1000);
    const candidateEnd = new Date(base.getTime() + 3 * 60 * 60 * 1000);

    const result = detectConflict(
      [approvedBooking],
      candidateStart,
      candidateEnd,
      mockResource3DPrinter
    );

    expect(result.hasConflict).toBe(true);
    expect(result.conflictingBookings.length).toBe(1);
    expect(result.suggestedSlots.length).toBeGreaterThan(0);
  });
});

describe('Suspicious Patterns, Overdue, and Extensions', () => {
  it('flags users with >=2 late returns or >=1 damage for human review badge', () => {
    const clearProfile: Profile = { ...mockProfileUser, late_count: 0, damage_count: 0 };
    expect(detectSuspiciousPatterns(clearProfile).isSuspicious).toBe(false);

    const flaggedProfile: Profile = {
      ...mockProfileUser,
      late_count: 2,
      damage_count: 1,
    };
    const flagged = detectSuspiciousPatterns(flaggedProfile);
    expect(flagged.isSuspicious).toBe(true);
    expect(flagged.flags.length).toBe(2);
  });

  it('flags overdue bookings when current time surpasses scheduled end_at', () => {
    const pastCheckedIn: Booking = {
      id: 'b-overdue',
      resource_id: 'res-1',
      user_id: 'u-1',
      start_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      end_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // ended 30 mins ago
      purpose: 'Overdue test',
      status: 'checked_in',
      is_overdue: false,
      extension_requested: false,
      created_at: new Date().toISOString(),
    };

    expect(isBookingOverdue(pastCheckedIn)).toBe(true);
  });

  it('evaluates extension validity against facility closing and upcoming reservations', () => {
    const now = new Date();
    now.setHours(18, 0, 0, 0); // close_hour is 20:00

    const activeBooking: Booking = {
      id: 'b-active',
      resource_id: mockResource3DPrinter.id,
      user_id: 'u-1',
      start_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      end_at: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString(), // 19:00
      purpose: 'Active',
      status: 'checked_in',
      is_overdue: false,
      extension_requested: false,
      created_at: new Date().toISOString(),
    };

    // +1h extension moves end to 20:00 (within 20:00 closing)
    const validExt = canExtendBooking(activeBooking, mockResource3DPrinter, [activeBooking], 1);
    expect(validExt.canExtend).toBe(true);

    // +2h extension moves end to 21:00 (exceeds 20:00 closing)
    const invalidExt = canExtendBooking(activeBooking, mockResource3DPrinter, [activeBooking], 2);
    expect(invalidExt.canExtend).toBe(false);
  });
});
