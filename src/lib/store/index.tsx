'use client';

import {
  AuditLogEntry,
  Booking,
  BookingStatus,
  ConditionReport,
  Incident,
  IncidentSeverity,
  IncidentType,
  Notification,
  Profile,
  Qualification,
  Resource,
  UserQualification,
} from '@/types';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  canExtendBooking,
  computeFairShareScore,
  detectConflict,
  orderWaitlist,
  promoteTopWaitlist,
} from '../domain';
import {
  INITIAL_AUDIT_LOG,
  INITIAL_BOOKINGS,
  INITIAL_CONDITION_REPORTS,
  INITIAL_INCIDENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PROFILES,
  INITIAL_QUALIFICATIONS,
  INITIAL_RESOURCES,
  INITIAL_USER_QUALIFICATIONS,
} from './demo-data';

interface LabLendContextType {
  currentUser: Profile;
  allUsers: Profile[];
  setCurrentUser: (user: Profile) => void;
  switchUserById: (id: string) => void;
  resources: Resource[];
  addResource: (res: Omit<Resource, 'id'>) => Resource;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  bookings: Booking[];
  requestBooking: (req: {
    resource_id: string;
    start_at: string;
    end_at: string;
    purpose: string;
  }) => {
    booking: Booking;
    waitlisted: boolean;
    conflictSlots?: Array<{ start: Date; end: Date }>;
  };
  decideBooking: (
    bookingId: string,
    decision: 'approved' | 'rejected' | 'waitlisted',
    reason: string
  ) => void;
  cancelBooking: (bookingId: string, reason?: string) => void;
  checkInBooking: (
    bookingId: string,
    report: {
      condition: ConditionReport['condition'];
      notes?: string;
      photo_paths: string[];
      checklist: Record<string, boolean>;
    }
  ) => void;
  returnBooking: (
    bookingId: string,
    report: {
      condition: ConditionReport['condition'];
      notes?: string;
      photo_paths: string[];
      checklist: Record<string, boolean>;
    },
    incidentData?: {
      type: IncidentType;
      severity: IncidentSeverity;
      description: string;
    }
  ) => void;
  extendBookingAction: (bookingId: string, hours?: number) => { success: boolean; message: string };
  markNoShowAction: (bookingId: string) => void;
  conditionReports: ConditionReport[];
  incidents: Incident[];
  resolveIncidentAction: (
    incidentId: string,
    resolution: string,
    applyPenalty: boolean
  ) => void;
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  auditLogs: AuditLogEntry[];
  qualifications: Qualification[];
  userQualifications: UserQualification[];
  requestQualificationVerification: (qualificationId: string, evidencePath: string) => void;
  reviewUserQualification: (id: string, status: 'verified' | 'declined') => void;
  verifyOwnerStatus: (ownerId: string, verified: boolean) => void;
  resetToSeedData: () => void;
}

const LabLendContext = createContext<LabLendContextType | null>(null);

const STORAGE_KEY = 'lablend_state_v1';

export function LabLendProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentUser, setCurrentUser] = useState<Profile>(INITIAL_PROFILES[0]);
  const [allUsers, setAllUsers] = useState<Profile[]>(INITIAL_PROFILES);
  const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [conditionReports, setConditionReports] = useState<ConditionReport[]>(INITIAL_CONDITION_REPORTS);
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOG);
  const [qualifications] = useState<Qualification[]>(INITIAL_QUALIFICATIONS);
  const [userQualifications, setUserQualifications] = useState<UserQualification[]>(INITIAL_USER_QUALIFICATIONS);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.allUsers) setAllUsers(parsed.allUsers);
        if (parsed.currentUserId) {
          const user = (parsed.allUsers || INITIAL_PROFILES).find(
            (u: Profile) => u.id === parsed.currentUserId
          );
          if (user) setCurrentUser(user);
        }
        if (parsed.resources) setResources(parsed.resources);
        if (parsed.bookings) setBookings(parsed.bookings);
        if (parsed.conditionReports) setConditionReports(parsed.conditionReports);
        if (parsed.incidents) setIncidents(parsed.incidents);
        if (parsed.notifications) setNotifications(parsed.notifications);
        if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
        if (parsed.userQualifications) setUserQualifications(parsed.userQualifications);
      }
    } catch {
      // Use defaults
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage whenever state updates
  useEffect(() => {
    if (!isHydrated) return;
    try {
      const state = {
        currentUserId: currentUser.id,
        allUsers,
        resources,
        bookings,
        conditionReports,
        incidents,
        notifications,
        auditLogs,
        userQualifications,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [
    isHydrated,
    currentUser,
    allUsers,
    resources,
    bookings,
    conditionReports,
    incidents,
    notifications,
    auditLogs,
    userQualifications,
  ]);

  const addAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'created_at'>) => {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const addNotification = (userId: string, type: string, message: string) => {
    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      type,
      message,
      read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const switchUserById = (id: string) => {
    const user = allUsers.find((u) => u.id === id);
    if (user) {
      setCurrentUser(user);
    }
  };

  const addResource = (res: Omit<Resource, 'id'>): Resource => {
    const newRes: Resource = {
      ...res,
      id: `res-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setResources((prev) => [newRes, ...prev]);
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: 'RESOURCE_CREATED',
      entity_type: 'resource',
      entity_id: newRes.id,
      detail: `Created new listing: ${newRes.name} (${newRes.category}) at ${newRes.location}`,
    });
    return newRes;
  };

  const updateResource = (id: string, updates: Partial<Resource>) => {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: 'RESOURCE_UPDATED',
      entity_type: 'resource',
      entity_id: id,
      detail: `Updated resource properties: ${Object.keys(updates).join(', ')}`,
    });
  };

  const requestBooking = ({
    resource_id,
    start_at,
    end_at,
    purpose,
  }: {
    resource_id: string;
    start_at: string;
    end_at: string;
    purpose: string;
  }) => {
    const targetResource = resources.find((r) => r.id === resource_id);
    if (!targetResource) throw new Error('Resource not found');

    const start = new Date(start_at);
    const end = new Date(end_at);

    // Compute fair-share score
    const userBookings = bookings.filter((b) => b.user_id === currentUser.id);
    const fairShare = computeFairShareScore(currentUser, userBookings, start);

    // Conflict detection
    const conflict = detectConflict(bookings, start, end, targetResource);
    const status: BookingStatus = conflict.hasConflict ? 'waitlisted' : 'pending';

    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      resource_id,
      user_id: currentUser.id,
      start_at,
      end_at,
      purpose,
      status,
      decision_reason: conflict.hasConflict
        ? 'Time slot conflict detected. Placed in fair-share waitlist queue.'
        : null,
      is_overdue: false,
      extension_requested: false,
      created_at: new Date().toISOString(),
      fair_share_score: fairShare.score,
    };

    setBookings((prev) => [newBooking, ...prev]);

    // Audit log
    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: conflict.hasConflict ? 'BOOKING_WAITLISTED' : 'BOOKING_REQUESTED',
      entity_type: 'booking',
      entity_id: newBooking.id,
      booking_id: newBooking.id,
      detail: `Requested session for ${targetResource.name}. Fair-share score: ${fairShare.score}. Status: ${status}`,
    });

    // Notify resource owner
    addNotification(
      targetResource.owner_id,
      'booking_request',
      `New ${status} request for ${targetResource.name} from ${currentUser.full_name}.`
    );

    return {
      booking: newBooking,
      waitlisted: conflict.hasConflict,
      conflictSlots: conflict.suggestedSlots,
    };
  };

  const decideBooking = (
    bookingId: string,
    decision: 'approved' | 'rejected' | 'waitlisted',
    reason: string
  ) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: decision,
              decision_reason: reason,
              decided_by: currentUser.id,
              decided_at: new Date().toISOString(),
            }
          : b
      )
    );

    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: `BOOKING_${decision.toUpperCase()}`,
      entity_type: 'booking',
      entity_id: bookingId,
      booking_id: bookingId,
      detail: `Owner marked booking as ${decision}. Reason: ${reason}`,
    });

    addNotification(
      booking.user_id,
      `booking_${decision}`,
      `Your booking request was ${decision}. Reason: "${reason}"`
    );
  };

  const cancelBooking = (bookingId: string, reason: string = 'User cancelled booking') => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const wasApproved = booking.status === 'approved';
    const hoursNotice = (new Date(booking.start_at).getTime() - Date.now()) / (1000 * 60 * 60);

    // Track late cancellation if < 24h
    if (hoursNotice < 24 && hoursNotice > 0 && wasApproved) {
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === booking.user_id
            ? { ...u, late_cancel_count: (u.late_cancel_count || 0) + 1 }
            : u
        )
      );
    }

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'cancelled',
              decision_reason: reason,
              decided_at: new Date().toISOString(),
            }
          : b
      )
    );

    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: 'BOOKING_CANCELLED',
      entity_type: 'booking',
      entity_id: bookingId,
      booking_id: bookingId,
      detail: `Booking cancelled: ${reason}. (${hoursNotice.toFixed(1)}h notice)`,
    });

    // Auto-promote top waitlisted request if an approved booking was cancelled
    if (wasApproved) {
      const waitlistForResource = bookings.filter(
        (b) => b.resource_id === booking.resource_id && b.status === 'waitlisted'
      );
      if (waitlistForResource.length > 0) {
        const { promotedBooking } = promoteTopWaitlist(waitlistForResource);
        if (promotedBooking) {
          setBookings((prev) =>
            prev.map((b) => (b.id === promotedBooking.id ? promotedBooking : b))
          );
          addAuditLog({
            actor_id: null,
            actor_name: 'Automated Fair-Share Engine',
            action: 'WAITLIST_AUTO_PROMOTED',
            entity_type: 'booking',
            entity_id: promotedBooking.id,
            booking_id: promotedBooking.id,
            detail: `Auto-promoted waitlisted request ${promotedBooking.id} to pending following cancellation of prior approved session.`,
          });
          addNotification(
            promotedBooking.user_id,
            'waitlist_promoted',
            'Great news! A slot opened up and your waitlisted request was auto-promoted to pending for owner confirmation.'
          );
        }
      }
    }
  };

  const checkInBooking = (
    bookingId: string,
    report: {
      condition: ConditionReport['condition'];
      notes?: string;
      photo_paths: string[];
      checklist: Record<string, boolean>;
    }
  ) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'checked_in' } : b))
    );

    const newReport: ConditionReport = {
      id: `cr-${Date.now()}-before`,
      booking_id: bookingId,
      stage: 'before',
      condition: report.condition,
      notes: report.notes,
      photo_paths: report.photo_paths,
      checklist: report.checklist,
      recorded_by: currentUser.id,
      recorded_at: new Date().toISOString(),
    };

    setConditionReports((prev) => [newReport, ...prev]);

    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: 'BOOKING_CHECKED_IN',
      entity_type: 'booking',
      entity_id: bookingId,
      booking_id: bookingId,
      detail: `Checked in. Condition reported: ${report.condition}. Photo verification recorded.`,
    });
  };

  const returnBooking = (
    bookingId: string,
    report: {
      condition: ConditionReport['condition'];
      notes?: string;
      photo_paths: string[];
      checklist: Record<string, boolean>;
    },
    incidentData?: {
      type: IncidentType;
      severity: IncidentSeverity;
      description: string;
    }
  ) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    // Check if late return
    const isLate = Date.now() > new Date(booking.end_at).getTime() + 10 * 60 * 1000;
    if (isLate) {
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === booking.user_id ? { ...u, late_count: (u.late_count || 0) + 1 } : u
        )
      );
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'returned', is_overdue: false } : b))
    );

    const newReport: ConditionReport = {
      id: `cr-${Date.now()}-after`,
      booking_id: bookingId,
      stage: 'after',
      condition: report.condition,
      notes: report.notes,
      photo_paths: report.photo_paths,
      checklist: report.checklist,
      recorded_by: currentUser.id,
      recorded_at: new Date().toISOString(),
    };
    setConditionReports((prev) => [newReport, ...prev]);

    // Handle incident if damaged or incident provided
    if (report.condition === 'damaged' || incidentData) {
      const inc: Incident = {
        id: `inc-${Date.now()}`,
        booking_id: bookingId,
        reported_by: currentUser.id,
        type: incidentData?.type || 'damage',
        severity: incidentData?.severity || 'minor',
        description:
          incidentData?.description ||
          report.notes ||
          'Equipment returned in damaged condition during return check-in.',
        status: 'open',
        penalty_applied: false,
        created_at: new Date().toISOString(),
      };
      setIncidents((prev) => [inc, ...prev]);

      addAuditLog({
        actor_id: currentUser.id,
        actor_name: currentUser.full_name,
        action: 'INCIDENT_FILED',
        entity_type: 'incident',
        entity_id: inc.id,
        booking_id: bookingId,
        detail: `Incident reported: ${inc.type} (${inc.severity}). Awaiting owner review.`,
      });

      // Notify owner
      const res = resources.find((r) => r.id === booking.resource_id);
      if (res) {
        addNotification(
          res.owner_id,
          'incident_alert',
          `Incident reported on return of ${res.name} by ${currentUser.full_name}. Review suggested.`
        );
      }
    }

    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: 'BOOKING_RETURNED',
      entity_type: 'booking',
      entity_id: bookingId,
      booking_id: bookingId,
      detail: `Returned equipment. Return condition: ${report.condition}. ${isLate ? 'Late return recorded.' : 'On schedule.'}`,
    });
  };

  const extendBookingAction = (bookingId: string, hours: number = 1) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, message: 'Booking not found' };

    const resource = resources.find((r) => r.id === booking.resource_id);
    if (!resource) return { success: false, message: 'Resource not found' };

    const result = canExtendBooking(booking, resource, bookings, hours);
    if (!result.canExtend || !result.newEndAt) {
      return { success: false, message: result.reason };
    }

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              end_at: result.newEndAt!.toISOString(),
              extension_requested: true,
              extension_status: 'approved',
            }
          : b
      )
    );

    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: 'BOOKING_EXTENDED',
      entity_type: 'booking',
      entity_id: bookingId,
      booking_id: bookingId,
      detail: `Extension approved for +${hours}h until ${result.newEndAt.toLocaleTimeString()}.`,
    });

    return { success: true, message: result.reason };
  };

  const markNoShowAction = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'no_show',
              decision_reason: 'User did not check in within 30 minutes of scheduled start time.',
            }
          : b
      )
    );

    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: 'BOOKING_NO_SHOW',
      entity_type: 'booking',
      entity_id: bookingId,
      booking_id: bookingId,
      detail: 'Marked booking as no-show after grace period expiration.',
    });

    addNotification(
      booking.user_id,
      'no_show_notice',
      'Your scheduled reservation was marked as a no-show because check-in was not completed in time.'
    );
  };

  const resolveIncidentAction = (
    incidentId: string,
    resolution: string,
    applyPenalty: boolean
  ) => {
    const inc = incidents.find((i) => i.id === incidentId);
    if (!inc) return;

    setIncidents((prev) =>
      prev.map((i) =>
        i.id === incidentId
          ? {
              ...i,
              status: 'resolved',
              resolution,
              penalty_applied: applyPenalty,
              resolved_by: currentUser.id,
              resolved_at: new Date().toISOString(),
            }
          : i
      )
    );

    if (applyPenalty) {
      const b = bookings.find((bk) => bk.id === inc.booking_id);
      if (b) {
        setAllUsers((prev) =>
          prev.map((u) =>
            u.id === b.user_id
              ? {
                  ...u,
                  damage_count: (u.damage_count || 0) + 1,
                  trust_score: Math.max(30, u.trust_score - 15),
                }
              : u
          )
        );
      }
    }

    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: 'INCIDENT_RESOLVED',
      entity_type: 'incident',
      entity_id: incidentId,
      booking_id: inc.booking_id,
      detail: `Incident resolved: ${resolution}. Penalty applied: ${applyPenalty ? 'Yes' : 'No'}.`,
    });
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const requestQualificationVerification = (
    qualificationId: string,
    evidencePath: string
  ) => {
    const newQual: UserQualification = {
      id: `uq-${Date.now()}`,
      user_id: currentUser.id,
      qualification_id: qualificationId,
      status: 'pending',
      evidence_path: evidencePath,
      created_at: new Date().toISOString(),
    };
    setUserQualifications((prev) => [newQual, ...prev]);

    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: 'QUALIFICATION_REQUESTED',
      entity_type: 'user_qualification',
      entity_id: newQual.id,
      detail: `Uploaded certificate evidence for qualification verification (${qualificationId}).`,
    });
  };

  const reviewUserQualification = (id: string, status: 'verified' | 'declined') => {
    setUserQualifications((prev) =>
      prev.map((uq) =>
        uq.id === id
          ? {
              ...uq,
              status,
              reviewed_by: currentUser.id,
              reviewed_at: new Date().toISOString(),
            }
          : uq
      )
    );

    const uq = userQualifications.find((q) => q.id === id);
    if (uq) {
      addAuditLog({
        actor_id: currentUser.id,
        actor_name: currentUser.full_name,
        action: `QUALIFICATION_${status.toUpperCase()}`,
        entity_type: 'user_qualification',
        entity_id: id,
        detail: `Admin reviewed qualification application: ${status}.`,
      });

      addNotification(
        uq.user_id,
        'qualification_update',
        `Your safety qualification review was marked as ${status}.`
      );
    }
  };

  const verifyOwnerStatus = (ownerId: string, verified: boolean) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === ownerId ? { ...u, owner_verified: verified } : u))
    );

    addAuditLog({
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action: verified ? 'OWNER_VERIFIED' : 'OWNER_UNVERIFIED',
      entity_type: 'profile',
      entity_id: ownerId,
      detail: `Admin set owner verification status to ${verified}.`,
    });
  };

  const resetToSeedData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setAllUsers(INITIAL_PROFILES);
    setCurrentUser(INITIAL_PROFILES[0]);
    setResources(INITIAL_RESOURCES);
    setBookings(INITIAL_BOOKINGS);
    setConditionReports(INITIAL_CONDITION_REPORTS);
    setIncidents(INITIAL_INCIDENTS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAuditLogs(INITIAL_AUDIT_LOG);
    setUserQualifications(INITIAL_USER_QUALIFICATIONS);
  };

  return (
    <LabLendContext.Provider
      value={{
        currentUser,
        allUsers,
        setCurrentUser,
        switchUserById,
        resources,
        addResource,
        updateResource,
        bookings,
        requestBooking,
        decideBooking,
        cancelBooking,
        checkInBooking,
        returnBooking,
        extendBookingAction,
        markNoShowAction,
        conditionReports,
        incidents,
        resolveIncidentAction,
        notifications,
        markNotificationRead,
        auditLogs,
        qualifications,
        userQualifications,
        requestQualificationVerification,
        reviewUserQualification,
        verifyOwnerStatus,
        resetToSeedData,
      }}
    >
      {children}
    </LabLendContext.Provider>
  );
}

export function useLabLend() {
  const context = useContext(LabLendContext);
  if (!context) {
    throw new Error('useLabLend must be used within a LabLendProvider');
  }
  return context;
}
