import {
  Booking,
  EligibilityResult,
  Profile,
  Resource,
  UserQualification,
} from '@/types';

/**
 * 1. Computes rolling 7-day hours used by a user for a resource or across resources.
 */
export function getRolling7DayUsageHours(
  userBookings: Booking[],
  referenceTime: Date = new Date(),
  resourceId?: string
): number {
  const sevenDaysAgo = new Date(referenceTime.getTime() - 7 * 24 * 60 * 60 * 1000);

  return userBookings
    .filter((b) => {
      if (resourceId && b.resource_id !== resourceId) return false;
      // Count approved, checked_in, returned bookings
      if (!['approved', 'checked_in', 'returned'].includes(b.status)) return false;
      const start = new Date(b.start_at);
      return start >= sevenDaysAgo && start <= referenceTime;
    })
    .reduce((acc, b) => {
      const start = new Date(b.start_at).getTime();
      const end = new Date(b.end_at).getTime();
      const hours = Math.max(0, (end - start) / (1000 * 60 * 60));
      return acc + hours;
    }, 0);
}

/**
 * 2. Fair-share score calculation:
 * Fair-share score = hours used in last 7 days + 2 × late returns + 1 × late cancellations (<24h).
 * LOWER score gets higher priority.
 */
export function computeFairShareScore(
  profile: Profile,
  userBookings: Booking[],
  referenceTime: Date = new Date()
): {
  score: number;
  breakdown: {
    hoursUsed7d: number;
    lateCount: number;
    lateCancelCount: number;
  };
} {
  const hoursUsed7d = Math.round(getRolling7DayUsageHours(userBookings, referenceTime) * 10) / 10;
  const lateCount = profile.late_count || 0;
  const lateCancelCount = profile.late_cancel_count || 0;

  const score = hoursUsed7d + 2 * lateCount + 1 * lateCancelCount;
  return {
    score: Math.round(score * 10) / 10,
    breakdown: {
      hoursUsed7d,
      lateCount,
      lateCancelCount,
    },
  };
}

/**
 * 3. Weekly Fair-Use Cap Verification:
 * Default 8 hours in rolling 7-day window (configurable).
 */
export function checkWeeklyCap(
  userBookings: Booking[],
  requestedDurationHours: number,
  weeklyCapHours: number = 8,
  referenceTime: Date = new Date(),
  resourceId?: string
): { allowed: boolean; usedHours: number; remainingHours: number } {
  const usedHours = getRolling7DayUsageHours(userBookings, referenceTime, resourceId);
  const remainingHours = Math.max(0, weeklyCapHours - usedHours);
  const allowed = usedHours + requestedDurationHours <= weeklyCapHours;
  return {
    allowed,
    usedHours: Math.round(usedHours * 10) / 10,
    remainingHours: Math.round(remainingHours * 10) / 10,
  };
}

/**
 * 4. Comprehensive Eligibility Check:
 * Returns array of { ok, label, reason }
 */
export function checkEligibility({
  resource,
  user,
  userQualifications = [],
  requestedStart,
  requestedEnd,
  userBookings = [],
  weeklyCapHours = 8,
}: {
  resource: Resource;
  user: Profile;
  userQualifications?: UserQualification[];
  requestedStart: Date;
  requestedEnd: Date;
  userBookings?: Booking[];
  weeklyCapHours?: number;
}): {
  isEligible: boolean;
  checks: EligibilityResult[];
} {
  const checks: EligibilityResult[] = [];
  const now = new Date();

  // 1. Resource Available status
  if (resource.status === 'available') {
    checks.push({
      ok: true,
      label: 'Resource Status',
      reason: 'Resource is currently operational and available for booking.',
    });
  } else {
    checks.push({
      ok: false,
      label: 'Resource Status',
      reason: `Resource is currently ${resource.status} and cannot be reserved.`,
    });
  }

  // 2. Not in the past
  if (requestedStart.getTime() >= now.getTime() - 5 * 60 * 1000) {
    checks.push({
      ok: true,
      label: 'Booking Timing',
      reason: 'Requested start time is in the future.',
    });
  } else {
    checks.push({
      ok: false,
      label: 'Booking Timing',
      reason: 'Requested start time cannot be in the past.',
    });
  }

  // 3. Duration <= max_hours_per_booking
  const durationHours = (requestedEnd.getTime() - requestedStart.getTime()) / (1000 * 60 * 60);
  if (durationHours > 0 && durationHours <= resource.max_hours_per_booking) {
    checks.push({
      ok: true,
      label: 'Session Duration',
      reason: `${durationHours}h request is within maximum limit of ${resource.max_hours_per_booking}h.`,
    });
  } else {
    checks.push({
      ok: false,
      label: 'Session Duration',
      reason: `Requested duration (${durationHours.toFixed(1)}h) exceeds max allowed limit of ${resource.max_hours_per_booking}h.`,
    });
  }

  // 4. Department restriction
  if (!resource.department_restriction || resource.department_restriction.trim() === '') {
    checks.push({
      ok: true,
      label: 'Department Access',
      reason: 'Open to all academic campus departments.',
    });
  } else if (
    user.department &&
    user.department.toLowerCase().includes(resource.department_restriction.toLowerCase())
  ) {
    checks.push({
      ok: true,
      label: 'Department Access',
      reason: `Matches required department (${resource.department_restriction}).`,
    });
  } else {
    checks.push({
      ok: false,
      label: 'Department Access',
      reason: `Restricted to ${resource.department_restriction} department. User department is ${user.department || 'unassigned'}.`,
    });
  }

  // 5. Qualification verified
  if (!resource.required_qualification_id) {
    checks.push({
      ok: true,
      label: 'Safety Certification',
      reason: 'No prerequisite safety training required for this asset.',
    });
  } else {
    const matchingQual = userQualifications.find(
      (uq) => uq.qualification_id === resource.required_qualification_id && uq.status === 'verified'
    );
    if (matchingQual) {
      checks.push({
        ok: true,
        label: 'Safety Certification',
        reason: 'Required safety training qualification is active and verified.',
      });
    } else {
      const pendingQual = userQualifications.find(
        (uq) => uq.qualification_id === resource.required_qualification_id && uq.status === 'pending'
      );
      checks.push({
        ok: false,
        label: 'Safety Certification',
        reason: pendingQual
          ? 'Required qualification certificate is pending admin review.'
          : 'Required safety qualification has not been completed or verified.',
      });
    }
  }

  // 6. Within opening hours & available days
  // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat
  // We represent days as 1=Mon ... 7=Sun
  const dayOfWeek = requestedStart.getDay() === 0 ? 7 : requestedStart.getDay();
  const isDayAvailable = resource.available_days.includes(dayOfWeek);

  const startHour = requestedStart.getHours() + requestedStart.getMinutes() / 60;
  const durationTotalHours = (requestedEnd.getTime() - requestedStart.getTime()) / (1000 * 60 * 60);
  const calculatedEndHour = startHour + durationTotalHours;
  const isWithinHours =
    startHour >= resource.open_hour &&
    calculatedEndHour <= resource.close_hour &&
    requestedStart.toDateString() === requestedEnd.toDateString();

  if (isDayAvailable && isWithinHours) {
    checks.push({
      ok: true,
      label: 'Operating Schedule',
      reason: `Request falls within facility operating hours (${resource.open_hour}:00 - ${resource.close_hour}:00).`,
    });
  } else {
    checks.push({
      ok: false,
      label: 'Operating Schedule',
      reason: !isDayAvailable
        ? 'Facility is closed on the selected day of the week.'
        : `Request (${startHour.toFixed(1)}:00 - ${calculatedEndHour.toFixed(1)}:00) falls outside opening hours (${resource.open_hour}:00 - ${resource.close_hour}:00).`,
    });
  }

  // 7. Blackout dates
  const dateStr = requestedStart.toISOString().split('T')[0];
  const isBlackout = resource.blackout_dates && resource.blackout_dates.includes(dateStr);
  if (!isBlackout) {
    checks.push({
      ok: true,
      label: 'Blackout Schedule',
      reason: 'No maintenance or campus holiday blackout on selected date.',
    });
  } else {
    checks.push({
      ok: false,
      label: 'Blackout Schedule',
      reason: `Selected date ${dateStr} is scheduled for campus maintenance or holiday blackout.`,
    });
  }

  // 8. Weekly fair-use cap
  const capCheck = checkWeeklyCap(
    userBookings,
    durationHours,
    weeklyCapHours,
    requestedStart,
    resource.id
  );
  if (capCheck.allowed) {
    checks.push({
      ok: true,
      label: 'Weekly Fair-Use Cap',
      reason: `Within 8-hour cap (Used: ${capCheck.usedHours}h, Requested: ${durationHours}h, Cap: ${weeklyCapHours}h).`,
    });
  } else {
    checks.push({
      ok: false,
      label: 'Weekly Fair-Use Cap',
      reason: `Exceeds weekly cap: You have used ${capCheck.usedHours}h in rolling 7-days. Requesting ${durationHours}h exceeds ${weeklyCapHours}h cap.`,
    });
  }

  const isEligible = checks.every((c) => c.ok);
  return { isEligible, checks };
}

/**
 * 5. Conflict Detection & Smart Slot Suggestion
 * Overlap against approved/checked_in bookings.
 * On conflict, suggests the 3 nearest free slots.
 */
export function detectConflict(
  existingBookings: Booking[],
  candidateStart: Date,
  candidateEnd: Date,
  resource: Resource
): {
  hasConflict: boolean;
  conflictingBookings: Booking[];
  suggestedSlots: Array<{ start: Date; end: Date }>;
} {
  const activeBookings = existingBookings.filter(
    (b) =>
      b.resource_id === resource.id &&
      ['approved', 'checked_in'].includes(b.status)
  );

  const reqStart = candidateStart.getTime();
  const reqEnd = candidateEnd.getTime();
  const durationMs = reqEnd - reqStart;

  const conflictingBookings = activeBookings.filter((b) => {
    const bStart = new Date(b.start_at).getTime();
    const bEnd = new Date(b.end_at).getTime();
    // Overlap condition: start < bEnd AND end > bStart
    return reqStart < bEnd && reqEnd > bStart;
  });

  const hasConflict = conflictingBookings.length > 0;
  const suggestedSlots: Array<{ start: Date; end: Date }> = [];

  if (hasConflict) {
    // Generate candidate test slots: immediately after conflicts, or earlier on the same day/next day
    const checkCandidate = (start: Date): boolean => {
      const end = new Date(start.getTime() + durationMs);
      const sH = start.getHours() + start.getMinutes() / 60;
      const eH = end.getHours() + end.getMinutes() / 60;
      if (sH < resource.open_hour || eH > resource.close_hour) return false;
      const dow = start.getDay() === 0 ? 7 : start.getDay();
      if (!resource.available_days.includes(dow)) return false;

      // Check conflict
      return !activeBookings.some((b) => {
        const bS = new Date(b.start_at).getTime();
        const bE = new Date(b.end_at).getTime();
        return start.getTime() < bE && end.getTime() > bS;
      });
    };

    // 1. Try slot right after latest conflict end
    const latestConflictEnd = Math.max(
      ...conflictingBookings.map((b) => new Date(b.end_at).getTime())
    );
    const candidateAfter = new Date(latestConflictEnd + 15 * 60 * 1000); // 15 min buffer
    if (checkCandidate(candidateAfter)) {
      suggestedSlots.push({
        start: candidateAfter,
        end: new Date(candidateAfter.getTime() + durationMs),
      });
    }

    // 2. Try slots forward in 1-hour increments
    let forwardOffsetHours = 1;
    while (suggestedSlots.length < 3 && forwardOffsetHours <= 48) {
      const nextCandidate = new Date(candidateStart.getTime() + forwardOffsetHours * 60 * 60 * 1000);
      if (checkCandidate(nextCandidate)) {
        // avoid near-duplicate
        const exists = suggestedSlots.some(
          (s) => Math.abs(s.start.getTime() - nextCandidate.getTime()) < 30 * 60 * 1000
        );
        if (!exists) {
          suggestedSlots.push({
            start: nextCandidate,
            end: new Date(nextCandidate.getTime() + durationMs),
          });
        }
      }
      forwardOffsetHours++;
    }
  }

  return {
    hasConflict,
    conflictingBookings,
    suggestedSlots,
  };
}

/**
 * 6. Waitlist Ordering & Fair-Share Promotion
 * Waitlist is ordered by fair-share score (lower score = higher priority),
 * tie-break by request time (earlier created_at wins).
 */
export function orderWaitlist(
  waitlistBookings: (Booking & { user?: Profile; fair_share_score?: number })[]
): (Booking & { user?: Profile; fair_share_score?: number })[] {
  return [...waitlistBookings].sort((a, b) => {
    const scoreA = a.fair_share_score ?? 0;
    const scoreB = b.fair_share_score ?? 0;
    if (scoreA !== scoreB) {
      return scoreA - scoreB; // Lower score first
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

/**
 * Auto-promote top waitlisted request when an approved booking is cancelled.
 */
export function promoteTopWaitlist(
  waitlistBookings: Booking[]
): {
  promotedBooking: Booking | null;
  remainingWaitlist: Booking[];
} {
  if (waitlistBookings.length === 0) {
    return { promotedBooking: null, remainingWaitlist: [] };
  }

  const sorted = orderWaitlist(waitlistBookings);
  const promoted = {
    ...sorted[0],
    status: 'pending' as const,
    decision_reason: 'Auto-promoted from waitlist queue upon prior booking cancellation. Awaiting owner confirmation.',
  };

  return {
    promotedBooking: promoted,
    remainingWaitlist: sorted.slice(1),
  };
}

/**
 * 7. Suspicious-pattern flags
 * Suspicious patterns:
 * - >= 2 late returns
 * - >= 1 damage
 * - repeated late cancels (>= 2)
 * - many bookings with no check-in (no-show >= 2)
 */
export function detectSuspiciousPatterns(
  profile: Profile,
  userBookings: Booking[] = []
): {
  isSuspicious: boolean;
  flags: string[];
} {
  const flags: string[] = [];

  if (profile.late_count >= 2) {
    flags.push(`Repeated late returns (${profile.late_count} recorded)`);
  }
  if (profile.damage_count >= 1) {
    flags.push(`Equipment damage on record (${profile.damage_count} incident)`);
  }
  if (profile.late_cancel_count >= 2) {
    flags.push(`Repeated short-notice cancellations (<24h) (${profile.late_cancel_count})`);
  }

  const noShows = userBookings.filter((b) => b.status === 'no_show').length;
  if (noShows >= 2) {
    flags.push(`Frequent unattended bookings / no-shows (${noShows})`);
  }

  return {
    isSuspicious: flags.length > 0,
    flags,
  };
}

/**
 * 8. Overdue check:
 * Returns true if booking is currently 'checked_in' and now > end_at.
 */
export function isBookingOverdue(booking: Booking, now: Date = new Date()): boolean {
  if (booking.status !== 'checked_in') return false;
  return now.getTime() > new Date(booking.end_at).getTime();
}

/**
 * 9. Extension validity:
 * User requests +1h: allowed only if no conflict and within facility closing hour.
 */
export function canExtendBooking(
  booking: Booking,
  resource: Resource,
  allBookings: Booking[],
  additionalHours: number = 1
): { canExtend: boolean; reason: string; newEndAt?: Date } {
  if (booking.status !== 'checked_in') {
    return { canExtend: false, reason: 'Only actively checked-in bookings can be extended.' };
  }

  const currentEnd = new Date(booking.end_at);
  const newEnd = new Date(currentEnd.getTime() + additionalHours * 60 * 60 * 1000);

  // Check facility closing time
  const newEndHour = newEnd.getHours() + newEnd.getMinutes() / 60;
  if (newEndHour > resource.close_hour) {
    return {
      canExtend: false,
      reason: `Extended time (${newEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) exceeds facility closing hour (${resource.close_hour}:00).`,
    };
  }

  // Check conflict with upcoming bookings
  const hasConflict = allBookings.some((b) => {
    if (b.id === booking.id) return false;
    if (b.resource_id !== booking.resource_id) return false;
    if (!['approved', 'checked_in'].includes(b.status)) return false;

    const bStart = new Date(b.start_at).getTime();
    const bEnd = new Date(b.end_at).getTime();
    return currentEnd.getTime() < bEnd && newEnd.getTime() > bStart;
  });

  if (hasConflict) {
    return {
      canExtend: false,
      reason: 'Another approved reservation starts during the requested extension window.',
    };
  }

  return {
    canExtend: true,
    reason: `Extension granted for +${additionalHours}h until ${newEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
    newEndAt: newEnd,
  };
}
