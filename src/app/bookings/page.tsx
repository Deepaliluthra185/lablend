'use client';

import { useLabLend } from '@/lib/store';
import { Booking, BookingStatus } from '@/types';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';

type TabType = 'all' | 'upcoming' | 'active' | 'waitlisted' | 'past';

export default function MyBookingsPage() {
  const { currentUser, bookings, resources, cancelBooking } = useLabLend();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // User's own bookings
  const userBookings = useMemo(() => {
    return bookings
      .filter((b) => b.user_id === currentUser.id)
      .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());
  }, [bookings, currentUser.id]);

  // Tab filtering
  const filteredBookings = useMemo(() => {
    return userBookings.filter((b) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'upcoming') return ['pending', 'approved'].includes(b.status);
      if (activeTab === 'active') return b.status === 'checked_in';
      if (activeTab === 'waitlisted') return b.status === 'waitlisted';
      if (activeTab === 'past') return ['returned', 'rejected', 'cancelled', 'no_show'].includes(b.status);
      return true;
    });
  }, [userBookings, activeTab]);

  const handleConfirmCancel = () => {
    if (!cancelModalBooking) return;
    cancelBooking(cancelModalBooking.id, cancelReason.trim() || 'User requested cancellation');
    setCancelModalBooking(null);
    setCancelReason('');
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
            <Clock className="w-3 h-3" /> Awaiting Owner Review
          </span>
        );
      case 'waitlisted':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
            <RotateCcw className="w-3 h-3" /> In Fair-Share Waitlist
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
            <Sparkles className="w-3 h-3" /> Active Loan (Checked-in)
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Returned & Audited
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
            <XCircle className="w-3 h-3" /> Declined by Owner
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
            Cancelled
          </span>
        );
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
            <AlertCircle className="w-3 h-3" /> No-Show
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title & User Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            <Layers className="w-4 h-4" />
            Personal Reservation Hub
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            My Bookings & Loans
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage your campus equipment sessions, inspect owner review reasons, and complete verified check-ins and returns.
          </p>
        </div>

        <Link
          href="/discover"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition shadow-sm"
        >
          <Search className="w-4 h-4" /> Discover More Equipment
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
        {[
          { id: 'all', label: 'All Sessions', count: userBookings.length },
          {
            id: 'upcoming',
            label: 'Upcoming',
            count: userBookings.filter((b) => ['pending', 'approved'].includes(b.status)).length,
          },
          {
            id: 'active',
            label: 'Active Loans',
            count: userBookings.filter((b) => b.status === 'checked_in').length,
          },
          {
            id: 'waitlisted',
            label: 'Waitlist',
            count: userBookings.filter((b) => b.status === 'waitlisted').length,
          },
          {
            id: 'past',
            label: 'Past & Records',
            count: userBookings.filter((b) => ['returned', 'rejected', 'cancelled', 'no_show'].includes(b.status)).length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            No bookings found in this view
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Explore available campus equipment, laboratory benches, or makerspace gear to submit your first reservation.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-500 transition"
          >
            Browse Available Inventory →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const resource = resources.find((r) => r.id === booking.resource_id);
            if (!resource) return null;

            const startDate = new Date(booking.start_at);
            const endDate = new Date(booking.end_at);
            const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

            return (
              <div
                key={booking.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={resource.photos[0]}
                      alt={resource.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 bg-slate-100 dark:bg-slate-800"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {resource.category}
                        </span>
                        {getStatusBadge(booking.status)}
                      </div>

                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        <Link href={`/booking/${booking.id}`} className="hover:text-sky-600 transition">
                          {resource.name}
                        </Link>
                      </h2>

                      <p className="text-xs text-slate-500">{resource.location}</p>
                    </div>
                  </div>

                  {/* Scheduled Date/Time Badge */}
                  <div className="text-left sm:text-right shrink-0 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 sm:bg-transparent sm:border-0 sm:p-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {startDate.toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                      ({durationHours.toFixed(1)}h session)
                    </div>
                  </div>
                </div>

                {/* Purpose and Decision Notes */}
                <div className="text-xs space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-white shrink-0">Purpose:</strong>
                    <span>{booking.purpose}</span>
                  </div>

                  {booking.decision_reason && (
                    <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40 text-slate-700 dark:text-slate-300 text-[11px] flex items-start gap-1.5">
                      <span className="font-semibold text-sky-800 dark:text-sky-300 shrink-0">
                        Decision Note:
                      </span>
                      <span>{booking.decision_reason}</span>
                    </div>
                  )}
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    href={`/booking/${booking.id}`}
                    className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                  >
                    View Status, Why Panel & Timeline →
                  </Link>

                  <div className="flex items-center gap-2">
                    {/* Check In action */}
                    {booking.status === 'approved' && (
                      <Link
                        href={`/check-in/${booking.id}`}
                        className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
                      >
                        Start Check-In Wizard →
                      </Link>
                    )}

                    {/* Return action */}
                    {booking.status === 'checked_in' && (
                      <Link
                        href={`/return/${booking.id}`}
                        className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-sm"
                      >
                        Return Equipment →
                      </Link>
                    )}

                    {/* Cancel action */}
                    {['pending', 'approved', 'waitlisted'].includes(booking.status) && (
                      <button
                        type="button"
                        onClick={() => setCancelModalBooking(booking)}
                        className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 text-slate-600 dark:text-slate-300 font-semibold text-xs transition"
                      >
                        Cancel Reservation
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Modal with Late Cancellation Warning */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                Confirm Cancellation
              </h3>
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Check if short notice <24h */}
            {cancelModalBooking.status === 'approved' &&
              new Date(cancelModalBooking.start_at).getTime() - Date.now() < 24 * 3600 * 1000 && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Notice: Cancellation within 24 Hours
                  </p>
                  <p>
                    Cancelling an approved reservation with less than 24h notice increments your late cancellation count (+1 point on fair-share score). The top waitlisted student will be auto-promoted.
                  </p>
                </div>
              )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Cancellation
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Coursework finished early, lab rescheduling, etc."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition"
              >
                Yes, Cancel Reservation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
