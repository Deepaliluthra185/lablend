'use client';

import { computeFairShareScore, orderWaitlist } from '@/lib/domain';
import { useLabLend } from '@/lib/store';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  Flame,
  HelpCircle,
  History,
  Info,
  Layers,
  Lock,
  PlusCircle,
  RotateCcw,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { Suspense, useMemo, useState } from 'react';

function BookingDetailContent() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const {
    bookings,
    resources,
    currentUser,
    conditionReports,
    incidents,
    auditLogs,
    cancelBooking,
    extendBookingAction,
  } = useLabLend();

  const [extensionMessage, setExtensionMessage] = useState<{
    success: boolean;
    text: string;
  } | null>(null);

  const booking = bookings.find((b) => b.id === bookingId);
  const resource = resources.find((r) => r.id === booking?.resource_id);

  // Condition reports for this booking
  const beforeReport = conditionReports.find(
    (cr) => cr.booking_id === bookingId && cr.stage === 'before'
  );
  const afterReport = conditionReports.find(
    (cr) => cr.booking_id === bookingId && cr.stage === 'after'
  );

  // Incidents for this booking
  const bookingIncidents = incidents.filter((i) => i.booking_id === bookingId);

  // Audit logs for this booking
  const bookingAudit = auditLogs.filter(
    (a) => a.booking_id === bookingId || a.entity_id === bookingId
  );

  // Fair-share score computation
  const userBookings = useMemo(() => {
    return bookings.filter((b) => b.user_id === currentUser.id);
  }, [bookings, currentUser.id]);

  const fairShare = useMemo(() => {
    if (!mounted || !booking) {
      return { score: 0, breakdown: { hoursUsed7d: 0, lateCount: 0, lateCancelCount: 0 } };
    }
    return computeFairShareScore(
      currentUser,
      userBookings,
      new Date(booking.start_at)
    );
  }, [mounted, currentUser, userBookings, booking]);

  // Waitlist ranking
  const waitlistPosition = useMemo(() => {
    if (!mounted || !booking || booking.status !== 'waitlisted') return null;
    const resourceWaitlist = bookings.filter(
      (b) => b.resource_id === booking.resource_id && b.status === 'waitlisted'
    );
    const sorted = orderWaitlist(resourceWaitlist);
    const index = sorted.findIndex((b) => b.id === booking.id);
    return index !== -1 ? index + 1 : 1;
  }, [bookings, booking]);

  if (!booking || !resource) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Booking Not Found</h2>
        <p className="text-sm text-slate-500">The requested reservation record does not exist or has been archived.</p>
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Bookings
        </Link>
      </div>
    );
  }

  const startDate = new Date(booking.start_at);
  const endDate = new Date(booking.end_at);
  const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

  const handleRequestExtension = () => {
    const res = extendBookingAction(booking.id, 1);
    setExtensionMessage({
      success: res.success,
      text: res.message,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/bookings" className="hover:text-sky-600 flex items-center gap-1 font-medium transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Bookings
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-semibold truncate">
          Booking Record #{booking.id.slice(0, 12)}
        </span>
      </div>

      {/* Main Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <img
              src={resource.photos[0]}
              alt={resource.name}
              className="w-14 h-14 rounded-2xl object-cover shrink-0 bg-slate-100 dark:bg-slate-800"
            />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {resource.category}
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {resource.name}
              </h1>
              <p className="text-xs text-slate-500">{resource.location}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="text-left sm:text-right">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full ${
                booking.status === 'approved'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : booking.status === 'pending'
                  ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                  : booking.status === 'waitlisted'
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  : booking.status === 'checked_in'
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Status: {booking.status.replace('_', ' ')}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Created: {new Date(booking.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Schedule & Timing Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
            <span className="text-slate-400 text-[11px] block">Reserved Date</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {startDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
            <span className="text-slate-400 text-[11px] block">Time Window</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
              {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
              ({durationHours.toFixed(1)}h)
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
            <span className="text-slate-400 text-[11px] block">Booking Purpose</span>
            <span className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
              {booking.purpose}
            </span>
          </div>
        </div>

        {/* Contextual Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500">
            Booking ID: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">{booking.id}</code>
          </div>

          <div className="flex items-center gap-2">
            {booking.status === 'approved' && (
              <Link
                href={`/check-in/${booking.id}`}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" /> Start Check-In Wizard
              </Link>
            )}

            {booking.status === 'checked_in' && (
              <>
                <button
                  type="button"
                  onClick={handleRequestExtension}
                  className="py-2 px-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 font-bold text-xs border border-sky-200 dark:border-sky-800 transition flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Request +1h Extension
                </button>
                <Link
                  href={`/return/${booking.id}`}
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" /> Return Equipment
                </Link>
              </>
            )}

            {['pending', 'approved', 'waitlisted'].includes(booking.status) && (
              <button
                type="button"
                onClick={() => {
                  cancelBooking(booking.id, 'User self-cancelled');
                  router.push('/bookings');
                }}
                className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 text-slate-600 dark:text-slate-300 font-semibold text-xs transition"
              >
                Cancel Booking
              </button>
            )}
          </div>
        </div>

        {extensionMessage && (
          <div
            className={`p-3 rounded-xl text-xs ${
              extensionMessage.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {extensionMessage.text}
          </div>
        )}
      </div>

      {/* "WHY THIS DECISION?" EXPLANATION PANEL */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-sky-950 text-white shadow-xl border border-sky-800/40 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-sky-800/50">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-sky-400" />
            <h2 className="font-bold text-base sm:text-lg">Why this Decision? Transparent Campus Audit</h2>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
            Algorithmic Fairness
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Left: Written Reason & Applied Rule */}
          <div className="space-y-3">
            <div>
              <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold block mb-1">
                Owner Written Reason / Queue Status:
              </span>
              <p className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 leading-relaxed font-medium">
                {booking.decision_reason ||
                  (booking.status === 'pending'
                    ? 'Awaiting facility owner verification. Owners are required to supply a written justification upon approving, rejecting, or queueing.'
                    : 'Standard reservation lifecycle.')}
              </p>
            </div>

            {booking.status === 'waitlisted' && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  Waitlist Queue Position: Rank #{waitlistPosition || 1}
                </p>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  Your request is queued because another student holds this slot. If the approved student cancels or shortens their session, the Fair-Share Engine will auto-promote your request to pending and notify the owner.
                </p>
                <p className="text-[10px] text-amber-300/70 italic pt-1">
                  🔒 Under the Campus Privacy and Data Minimization Policy, identities of other students in the queue are strictly concealed.
                </p>
              </div>
            )}
          </div>

          {/* Right: Fair-Share Score Formula Breakdown */}
          <div className="space-y-3 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-400" />
                Fair-Share Priority Score
              </span>
              <span className="text-base font-extrabold text-emerald-400">
                {fairShare.score} pts
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Formula: <code className="text-sky-300">Hours Used (7d) + 2 × Late Returns + 1 × Late Cancels</code>
              <br />
              (Lower score receives higher priority in waitlist queues)
            </p>

            <div className="space-y-1.5 pt-2 border-t border-slate-700/60 text-[11px]">
              <div className="flex justify-between text-slate-300">
                <span>Recent 7-Day Equipment Usage:</span>
                <span className="font-semibold text-white">{fairShare.breakdown.hoursUsed7d} hrs</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Late Returns Recorded ({currentUser.late_count || 0} × 2):</span>
                <span className="font-semibold text-white">+{fairShare.breakdown.lateCount * 2} pts</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Late Cancellations &lt;24h ({currentUser.late_cancel_count || 0} × 1):</span>
                <span className="font-semibold text-white">+{fairShare.breakdown.lateCancelCount * 1} pts</span>
              </div>
              <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-700/40 font-bold">
                <span className="text-emerald-400">Total Calculated Score:</span>
                <span className="text-emerald-400">{fairShare.score} pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Before/After Condition Verification Reports */}
      {(beforeReport || afterReport) && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-sky-600" />
              Before & After Condition Proofing (Side-by-Side)
            </h3>
            <span className="text-xs text-slate-500">Tamper-Evident Asset Audit</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Before Report */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  1. Check-In Condition Report
                </span>
                {beforeReport ? (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      beforeReport.condition === 'good'
                        ? 'bg-emerald-100 text-emerald-800'
                        : beforeReport.condition === 'minor_wear'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    Condition: {beforeReport.condition.replace('_', ' ')}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Pending Check-in</span>
                )}
              </div>

              {beforeReport ? (
                <div className="space-y-3 text-xs">
                  {beforeReport.photo_paths.length > 0 && (
                    <img
                      src={beforeReport.photo_paths[0]}
                      alt="Before condition verification"
                      className="w-full h-44 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                    />
                  )}
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Inspector Notes:</strong> {beforeReport.notes || 'No defects recorded.'}
                  </p>
                  <div className="text-[11px] text-slate-400">
                    Timestamp: {new Date(beforeReport.recorded_at).toLocaleString()}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Check-in condition report has not been filed yet.
                </p>
              )}
            </div>

            {/* After Report */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  2. Return Condition Report
                </span>
                {afterReport ? (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      afterReport.condition === 'good'
                        ? 'bg-emerald-100 text-emerald-800'
                        : afterReport.condition === 'minor_wear'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    Condition: {afterReport.condition.replace('_', ' ')}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Pending Return</span>
                )}
              </div>

              {afterReport ? (
                <div className="space-y-3 text-xs">
                  {afterReport.photo_paths.length > 0 && (
                    <img
                      src={afterReport.photo_paths[0]}
                      alt="After condition verification"
                      className="w-full h-44 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                    />
                  )}
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Inspector Notes:</strong> {afterReport.notes || 'Returned in good condition.'}
                  </p>
                  <div className="text-[11px] text-slate-400">
                    Timestamp: {new Date(afterReport.recorded_at).toLocaleString()}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Return condition report will be recorded upon session completion.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Incidents & Resolutions Section */}
      {bookingIncidents.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-base text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Incidents & Resolution Log ({bookingIncidents.length})
            </h3>
            <span className="text-xs text-slate-500">Human Owner Reviewed</span>
          </div>

          <div className="space-y-3">
            {bookingIncidents.map((inc) => (
              <div
                key={inc.id}
                className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-900 dark:text-rose-200 capitalize">
                      {inc.type} Incident ({inc.severity} severity)
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inc.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inc.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(inc.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-slate-800 dark:text-slate-200">{inc.description}</p>

                {inc.ai_summary && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                    <strong className="text-sky-600 dark:text-sky-400 block mb-0.5">
                      AI Incident Summary (Advisory only):
                    </strong>
                    {inc.ai_summary}
                  </div>
                )}

                {inc.resolution && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-900 dark:text-emerald-200">
                    <strong className="block mb-0.5">Owner Resolution:</strong>
                    {inc.resolution}
                    {inc.penalty_applied && (
                      <span className="block mt-1 font-semibold text-rose-600">
                        Penalty assessed by owner.
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Append-Only Activity Timeline */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-sky-600" />
            Append-Only Audit Timeline
          </h3>
          <span className="text-[11px] text-slate-400">Immutable PostgreSQL Ledger</span>
        </div>

        {bookingAudit.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            Initial audit log entry recorded.
          </p>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {bookingAudit.map((log) => (
              <div key={log.id} className="relative text-xs space-y-1">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-sky-500 ring-4 ring-white dark:ring-slate-900" />
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{log.action}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">{log.detail}</p>
                <div className="text-[10px] text-slate-400">
                  Actor: <strong className="text-slate-700 dark:text-slate-300">{log.actor_name}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookingDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-sky-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading booking audit trail...</p>
        </div>
      }
    >
      <BookingDetailContent />
    </Suspense>
  );
}
