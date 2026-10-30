'use client';

import { computeFairShareScore, detectSuspiciousPatterns } from '@/lib/domain';
import { useLabLend } from '@/lib/store';
import { Booking, Resource, ResourceStatus } from '@/types';
import {
  AlertCircle,
  AlertTriangle,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  LayoutDashboard,
  Lock,
  Plus,
  RotateCcw,
  Scale,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Wrench,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import React, { Suspense, useMemo, useState } from 'react';

type OwnerTab = 'queue' | 'listings' | 'active' | 'incidents';

function OwnerDashboardContent() {
  const {
    currentUser,
    allUsers,
    resources,
    bookings,
    incidents,
    decideBooking,
    markNoShowAction,
    resolveIncidentAction,
    addResource,
    updateResource,
  } = useLabLend();

  const [activeTab, setActiveTab] = useState<OwnerTab>('queue');
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Review state
  const [decisionReasons, setDecisionReasons] = useState<Record<string, string>>({});

  // Incident resolution state
  const [resolutions, setResolutions] = useState<Record<string, string>>({});
  const [applyPenalties, setApplyPenalties] = useState<Record<string, boolean>>({});

  // Add Listing Modal
  const [showAddListingModal, setShowAddListingModal] = useState(false);
  const [newResourceName, setNewResourceName] = useState('');
  const [newCategory, setNewCategory] = useState<'makerspace' | 'labs' | 'cameras' | 'testing devices' | 'rooms'>('makerspace');
  const [newDescription, setNewDescription] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newOpenHour, setNewOpenHour] = useState(8);
  const [newCloseHour, setNewCloseHour] = useState(20);
  const [newMaxHours, setNewMaxHours] = useState(4);
  const [newSupervision, setNewSupervision] = useState(false);
  const [newDeptRestriction, setNewDeptRestriction] = useState('');
  const [newDepositNote, setNewDepositNote] = useState('');
  const [newUsageRules, setNewUsageRules] = useState('');

  // Resources owned by current user (or all if admin)
  const ownedResources = useMemo(() => {
    if (currentUser.role === 'admin') return resources;
    return resources.filter((r) => r.owner_id === currentUser.id);
  }, [resources, currentUser]);

  const ownedResourceIds = useMemo(() => {
    return ownedResources.map((r) => r.id);
  }, [ownedResources]);

  // Pending bookings for owned resources
  const pendingRequests = useMemo(() => {
    const list = bookings.filter(
      (b) => ownedResourceIds.includes(b.resource_id) && b.status === 'pending'
    );

    // Compute fair-share scores and sort (lowest score = highest priority)
    if (!mounted) return list;
    return list.sort((a, b) => {
      const userA = allUsers.find((u) => u.id === a.user_id) || currentUser;
      const userB = allUsers.find((u) => u.id === b.user_id) || currentUser;
      const bookingsA = bookings.filter((bk) => bk.user_id === a.user_id);
      const bookingsB = bookings.filter((bk) => bk.user_id === b.user_id);

      const scoreA = computeFairShareScore(userA, bookingsA).score;
      const scoreB = computeFairShareScore(userB, bookingsB).score;

      return scoreA - scoreB;
    });
  }, [bookings, ownedResourceIds, allUsers, currentUser, mounted]);

  // Active or checked-in bookings for owned resources
  const activeLoans = useMemo(() => {
    return bookings.filter(
      (b) => ownedResourceIds.includes(b.resource_id) && b.status === 'checked_in'
    );
  }, [bookings, ownedResourceIds]);

  // Incidents for owned resources
  const ownedIncidents = useMemo(() => {
    return incidents.filter((i) => {
      const b = bookings.find((bk) => bk.id === i.booking_id);
      return b && ownedResourceIds.includes(b.resource_id);
    });
  }, [incidents, bookings, ownedResourceIds]);

  const handleDecision = (
    bookingId: string,
    decision: 'approved' | 'rejected' | 'waitlisted'
  ) => {
    const reason = decisionReasons[bookingId]?.trim();
    if (!reason) {
      alert('A written reason is required by campus governance for all review decisions.');
      return;
    }
    decideBooking(bookingId, decision, reason);
    setDecisionReasons((prev) => ({ ...prev, [bookingId]: '' }));
  };

  const handleResolveIncident = (incidentId: string) => {
    const resText = resolutions[incidentId]?.trim();
    if (!resText) {
      alert('Please specify the written resolution steps.');
      return;
    }
    resolveIncidentAction(incidentId, resText, Boolean(applyPenalties[incidentId]));
    setResolutions((prev) => ({ ...prev, [incidentId]: '' }));
  };

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResourceName.trim() || !newLocation.trim()) return;

    addResource({
      owner_id: currentUser.id,
      name: newResourceName.trim(),
      category: newCategory,
      description: newDescription.trim() || 'Equipped campus research asset.',
      location: newLocation.trim(),
      photos: [
        newPhotoUrl.trim() ||
          'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      ],
      open_hour: newOpenHour,
      close_hour: newCloseHour,
      available_days: [1, 2, 3, 4, 5, 6],
      blackout_dates: [],
      max_hours_per_booking: newMaxHours,
      supervision_required: newSupervision,
      department_restriction: newDeptRestriction.trim() || null,
      deposit_note: newDepositNote.trim() || null,
      usage_rules: newUsageRules.trim() || null,
      status: 'available',
      keywords: [newCategory, 'campus', 'lab'],
    });

    setShowAddListingModal(false);
    setNewResourceName('');
    setNewDescription('');
    setNewLocation('');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header and Verification Status */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            <LayoutDashboard className="w-4 h-4" />
            Facility Owner Control Center
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Owner Management Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Review equipment requests, inspect fair-share scores, manage listings, and resolve condition reports with mandatory written reasons.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAddListingModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add New Asset Listing
          </button>
        </div>
      </div>

      {/* Unverified Owner Alert Banner */}
      {!currentUser.owner_verified && currentUser.role !== 'admin' && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Facility Owner Pending Verification</p>
            <p>
              Your account ({currentUser.full_name}, {currentUser.department}) is currently marked as unverified by Campus Operations. You can create listings, but booking reviews require administrator authorization.
            </p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              Tip: Switch demo persona to <strong>Elena Vance (Admin)</strong> to verify your account in the Admin Console.
            </p>
          </div>
        </div>
      )}

      {/* Dashboard KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-slate-400 text-[11px]">Managed Listings</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{ownedResources.length}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Active & Cataloged</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-slate-400 text-[11px]">Pending Review Queue</span>
          <p className="text-2xl font-extrabold text-sky-600 dark:text-sky-400">{pendingRequests.length}</p>
          <span className="text-[10px] text-sky-500 font-semibold">Ordered by Fair-Share</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-slate-400 text-[11px]">Active Equipment Loans</span>
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{activeLoans.length}</p>
          <span className="text-[10px] text-indigo-500 font-semibold">Checked In Now</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-slate-400 text-[11px]">Open Incident Reports</span>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
            {ownedIncidents.filter((i) => i.status !== 'resolved').length}
          </p>
          <span className="text-[10px] text-rose-500 font-semibold">Human Review Required</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
            activeTab === 'queue'
              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Review Queue</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {pendingRequests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('listings')}
          className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
            activeTab === 'listings'
              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>My Listings</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {ownedResources.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
            activeTab === 'active'
              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Active Loans</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {activeLoans.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('incidents')}
          className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
            activeTab === 'incidents'
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Incidents & Damage Queue</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {ownedIncidents.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PENDING REVIEW QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Review queue is empty</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All booking requests for your laboratory and makerspace assets have been reviewed.
              </p>
            </div>
          ) : (
            pendingRequests.map((booking) => {
              const res = resources.find((r) => r.id === booking.resource_id);
              const requester = allUsers.find((u) => u.id === booking.user_id) || currentUser;
              const requesterBookings = bookings.filter((bk) => bk.user_id === requester.id);
              const fairShareInfo = mounted
                ? computeFairShareScore(requester, requesterBookings)
                : { score: 0, breakdown: { hoursUsed7d: 0, lateCount: 0, lateCancelCount: 0 } };
              const suspicious = detectSuspiciousPatterns(requester, requesterBookings);

              const currentReason = decisionReasons[booking.id] || '';

              return (
                <div
                  key={booking.id}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {res?.category}
                        </span>
                        <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                          Pending Decision
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {res?.name}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Requested by: <strong className="text-slate-900 dark:text-white">{requester.full_name}</strong> ({requester.department} • {requester.id_number})
                      </p>
                    </div>

                    {/* Fair-Share Score & Flags */}
                    <div className="text-left sm:text-right space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                        <Scale className="w-3.5 h-3.5 text-emerald-600" />
                        Fair-Share Score: {fairShareInfo.score} pts
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {fairShareInfo.breakdown.hoursUsed7d}h recent usage • {requester.late_count} late • {requester.late_cancel_count} cancels
                      </p>
                    </div>
                  </div>

                  {/* Suspicious Patterns Review Badge */}
                  {suspicious.isSuspicious && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Review Suggested Flag (Human Discretion)
                      </p>
                      <ul className="list-disc list-inside text-[11px] text-amber-800 dark:text-amber-300">
                        {suspicious.flags.map((flag, fIdx) => (
                          <li key={fIdx}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Booking details */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Time Window:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {new Date(booking.start_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} -{' '}
                        {new Date(booking.end_at).toLocaleTimeString([], { timeStyle: 'short' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Student Statement / Purpose:</span>
                      <span className="text-slate-800 dark:text-slate-200 italic">
                        &ldquo;{booking.purpose}&rdquo;
                      </span>
                    </div>
                  </div>

                  {/* Mandatory Written Reason & Decision Buttons */}
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Owner Written Reason <span className="text-rose-500">* (Mandatory for governance transparency)</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 'Approved for senior capstone research batch run' or 'Declined due to scheduled lab maintenance'"
                        value={currentReason}
                        onChange={(e) =>
                          setDecisionReasons((prev) => ({
                            ...prev,
                            [booking.id]: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        disabled={!currentReason.trim()}
                        onClick={() => handleDecision(booking.id, 'rejected')}
                        className="py-2 px-3.5 rounded-xl border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-700 dark:text-rose-300 disabled:opacity-40 font-bold text-xs transition"
                      >
                        Decline Request
                      </button>

                      <button
                        type="button"
                        disabled={!currentReason.trim()}
                        onClick={() => handleDecision(booking.id, 'waitlisted')}
                        className="py-2 px-3.5 rounded-xl border border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950 text-amber-700 dark:text-amber-300 disabled:opacity-40 font-bold text-xs transition"
                      >
                        Queue in Waitlist
                      </button>

                      <button
                        type="button"
                        disabled={!currentReason.trim()}
                        onClick={() => handleDecision(booking.id, 'approved')}
                        className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 font-bold text-xs transition shadow-sm"
                      >
                        Approve Booking
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: MY LISTINGS (CRUD) */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ownedResources.map((res) => (
              <div
                key={res.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-40 rounded-xl overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                    <img src={res.photos[0]} alt={res.name} className="w-full h-full object-cover" />
                    <span
                      className={`absolute top-2.5 right-2.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        res.status === 'available'
                          ? 'bg-emerald-600 text-white'
                          : res.status === 'maintenance'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {res.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{res.name}</h3>
                    <p className="text-xs text-slate-500">{res.location}</p>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {res.description}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Facility Schedule:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {res.open_hour}:00 - {res.close_hour}:00
                    </strong>
                  </div>

                  {/* Status Toggle buttons */}
                  <div className="flex items-center gap-1 pt-1">
                    {(['available', 'maintenance', 'retired'] as ResourceStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => updateResource(res.id, { status: st })}
                        className={`flex-1 py-1 rounded text-[10px] font-bold uppercase transition ${
                          res.status === st
                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                            : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVE LOANS & NO-SHOW MANAGEMENT */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeLoans.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">No active loans in session</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When students complete before check-in with verified photos, active loans appear here for real-time monitoring.
              </p>
            </div>
          ) : (
            activeLoans.map((booking) => {
              const res = resources.find((r) => r.id === booking.resource_id);
              const user = allUsers.find((u) => u.id === booking.user_id);
              return (
                <div
                  key={booking.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        In Use Now
                      </span>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                        {res?.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Operator: <strong className="text-slate-900 dark:text-white">{user?.full_name}</strong> ({user?.department})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/booking/${booking.id}`}
                        className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                      >
                        Inspect Condition Proofs →
                      </Link>
                      <button
                        type="button"
                        onClick={() => markNoShowAction(booking.id)}
                        className="py-1.5 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-900 transition"
                      >
                        Mark No-Show
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 4: INCIDENTS QUEUE & RESOLUTIONS */}
      {activeTab === 'incidents' && (
        <div className="space-y-4">
          {ownedIncidents.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Zero open incidents</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All laboratory assets are intact with no unresolved damage, delay, or safety flags.
              </p>
            </div>
          ) : (
            ownedIncidents.map((inc) => {
              const resText = resolutions[inc.id] || '';
              const penaltyChecked = Boolean(applyPenalties[inc.id]);

              return (
                <div
                  key={inc.id}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                          {inc.type} Incident
                        </span>
                        <span className="text-xs font-semibold text-slate-400 capitalize">
                          Severity: {inc.severity}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                        Incident Report #{inc.id.slice(0, 10)}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Date: {new Date(inc.created_at).toLocaleString()}
                      </p>
                    </div>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        inc.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Status: {inc.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    <strong className="block text-slate-900 dark:text-white mb-0.5">Reported Description:</strong>
                    {inc.description}
                  </p>

                  {/* AI Incident Summary Box */}
                  {inc.ai_summary && (
                    <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs space-y-1">
                      <div className="flex items-center justify-between text-sky-800 dark:text-sky-300 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> AI Incident Brief
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-sky-200/50 dark:bg-sky-900/50">
                          AI suggestion, owner decides
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {inc.ai_summary}
                      </p>
                    </div>
                  )}

                  {/* Existing Resolution or Form */}
                  {inc.status === 'resolved' ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                      <p className="font-bold">Resolution Recorded:</p>
                      <p>{inc.resolution}</p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        Penalty applied: {inc.penalty_applied ? 'Yes (Trust score updated)' : 'No (Educational waiver)'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Owner Resolution Action / Lab Notes:
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 'Tip replaced from consumables bin. Student attended 15-min thermal recalibration briefing.'"
                          value={resText}
                          onChange={(e) =>
                            setResolutions((prev) => ({
                              ...prev,
                              [inc.id]: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={penaltyChecked}
                            onChange={(e) =>
                              setApplyPenalties((prev) => ({
                                ...prev,
                                [inc.id]: e.target.checked,
                              }))
                            }
                            className="rounded text-rose-600 focus:ring-rose-500"
                          />
                          <span>Apply penalty points to user trust score (deducts 15 pts)</span>
                        </label>

                        <button
                          type="button"
                          disabled={!resText.trim()}
                          onClick={() => handleResolveIncident(inc.id)}
                          className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs disabled:opacity-40 transition"
                        >
                          Confirm & Resolve Incident
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* CREATE NEW LISTING MODAL */}
      {showAddListingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                Add New Campus Asset Listing
              </h3>
              <button
                type="button"
                onClick={() => setShowAddListingModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Equipment / Space Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tektronix Arbitrary Function Generator AFG31000"
                  value={newResourceName}
                  onChange={(e) => setNewResourceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(
                        e.target.value as 'makerspace' | 'labs' | 'cameras' | 'testing devices' | 'rooms'
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="makerspace">Makerspace</option>
                    <option value="testing devices">Testing Devices</option>
                    <option value="cameras">Cameras & Media</option>
                    <option value="labs">Specialized Labs</option>
                    <option value="rooms">Rooms</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Campus Location
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ECE Hardware Lab, Room 204C"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description & Specifications
                </label>
                <textarea
                  rows={2}
                  placeholder="Technical details, accuracy limits, supported materials..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Open Hour
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={newOpenHour}
                    onChange={(e) => setNewOpenHour(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Close Hour
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={newCloseHour}
                    onChange={(e) => setNewCloseHour(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Hours
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={newMaxHours}
                    onChange={(e) => setNewMaxHours(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Photo URL (Public Image link)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department Restriction (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ECE (leave blank for all)"
                    value={newDeptRestriction}
                    onChange={(e) => setNewDeptRestriction(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={newSupervision}
                      onChange={(e) => setNewSupervision(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Technician Supervision Required</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddListingModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow-sm"
                >
                  Create Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OwnerPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading owner dashboard & queue...</p>
        </div>
      }
    >
      <OwnerDashboardContent />
    </Suspense>
  );
}
