'use client';

import { useLabLend } from '@/lib/store';
import {
  AlertCircle,
  Award,
  BarChart3,
  Building,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  History,
  Layers,
  Lock,
  RotateCcw,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import React, { Suspense, useMemo, useState } from 'react';

type AdminTab = 'owners' | 'qualifications' | 'analytics';

function AdminConsoleContent() {
  const {
    currentUser,
    allUsers,
    resources,
    bookings,
    incidents,
    qualifications,
    userQualifications,
    verifyOwnerStatus,
    reviewUserQualification,
  } = useLabLend();

  const [activeTab, setActiveTab] = useState<AdminTab>('owners');

  // Filter faculty / owners
  const facultyOwners = useMemo(() => {
    return allUsers.filter((u) => u.role === 'owner' || u.role === 'admin');
  }, [allUsers]);

  // Analytics computation
  const analytics = useMemo(() => {
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter((b) => b.status === 'returned').length;
    const totalIncidents = incidents.length;
    const damageRate = totalBookings > 0 ? ((totalIncidents / totalBookings) * 100).toFixed(1) : '0';
    const totalLate = allUsers.reduce((acc, u) => acc + (u.late_count || 0), 0);
    const lateRate = totalBookings > 0 ? ((totalLate / totalBookings) * 100).toFixed(1) : '0';

    // Resource utilization ranking
    const usageCounts: Record<string, number> = {};
    bookings.forEach((b) => {
      usageCounts[b.resource_id] = (usageCounts[b.resource_id] || 0) + 1;
    });

    const topResources = resources
      .map((r) => ({
        resource: r,
        bookingsCount: usageCounts[r.id] || 0,
      }))
      .sort((a, b) => b.bookingsCount - a.bookingsCount);

    return {
      totalBookings,
      completedBookings,
      totalIncidents,
      damageRate,
      lateRate,
      topResources,
    };
  }, [bookings, incidents, allUsers, resources]);

  return (
    <div className="space-y-8 animate-fade-in py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-sky-400">
            <Shield className="w-4 h-4" />
            Campus Governance Authority
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Campus Operations Admin Console
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Verify facility owners, review student safety qualifications, and audit campus equipment utilization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/audit"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 font-bold text-xs transition shadow-sm"
          >
            <History className="w-4 h-4" /> Global Audit Log &amp; CSV Export
          </Link>
        </div>
      </div>

      {/* Role Reminder if not viewing as Admin */}
      {currentUser.role !== 'admin' && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              You are currently viewing as <strong>{currentUser.full_name}</strong> ({currentUser.role}). Switch to <strong>Elena Vance (Admin)</strong> using the top demo bar to test administrative verification permissions.
            </span>
          </div>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('owners')}
          className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
            activeTab === 'owners'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Facility Owner Verification</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {facultyOwners.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('qualifications')}
          className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
            activeTab === 'qualifications'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Qualification Approvals</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {userQualifications.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
            activeTab === 'analytics'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Campus Analytics</span>
        </button>
      </div>

      {/* TAB 1: FACULTY OWNER VERIFICATION */}
      {activeTab === 'owners' && (
        <div className="space-y-4 text-xs">
          <p className="text-slate-500">
            Campus Rule: Only verified facility owners may approve student reservations and manage high-risk equipment.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {facultyOwners.map((owner) => (
              <div
                key={owner.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {owner.full_name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        owner.owner_verified
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {owner.owner_verified ? 'Verified Facility Owner' : 'Pending Verification'}
                    </span>
                  </div>

                  <p className="text-slate-500">
                    {owner.department} • ID: <strong className="text-slate-700 dark:text-slate-300">{owner.id_number}</strong>
                  </p>
                  <p className="text-slate-400 text-[11px]">{owner.email}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">
                    Trust Score: <strong className="text-emerald-600">{owner.trust_score}/100</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() => verifyOwnerStatus(owner.id, !owner.owner_verified)}
                    className={`py-1.5 px-3 rounded-lg font-bold text-xs transition ${
                      owner.owner_verified
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                    }`}
                  >
                    {owner.owner_verified ? 'Revoke Verification' : 'Verify Facility Owner'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: QUALIFICATION VERIFICATION */}
      {activeTab === 'qualifications' && (
        <div className="space-y-4 text-xs">
          <p className="text-slate-500">
            Review submitted student training certificates for 3D printing, laser cutters, and electronics benches.
          </p>

          <div className="space-y-3">
            {userQualifications.map((uq) => {
              const student = allUsers.find((u) => u.id === uq.user_id);
              const qual = qualifications.find((q) => q.id === uq.qualification_id);

              return (
                <div
                  key={uq.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {qual?.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          uq.status === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : uq.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {uq.status}
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400">
                      Applicant: <strong className="text-slate-900 dark:text-white">{student?.full_name}</strong> ({student?.department} • {student?.id_number})
                    </p>

                    <p className="text-[11px] text-slate-400">
                      Evidence File: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{uq.evidence_path || 'training_completion.pdf'}</code>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => reviewUserQualification(uq.id, 'declined')}
                      className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 text-rose-600 font-bold transition"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => reviewUserQualification(uq.id, 'verified')}
                      className="py-1.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-sm"
                    >
                      Approve &amp; Verify
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CAMPUS ANALYTICS & UTILIZATION */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 text-xs">
          {/* Top KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-slate-400 text-[11px]">Total Campus Loans</span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{analytics.totalBookings}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-slate-400 text-[11px]">Completed &amp; Returned</span>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{analytics.completedBookings}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-slate-400 text-[11px]">Damage Incident Rate</span>
              <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{analytics.damageRate}%</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-slate-400 text-[11px]">Late Return Rate</span>
              <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{analytics.lateRate}%</p>
            </div>
          </div>

          {/* Most Utilized Resources Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Campus Resource Utilization Ranking
            </h3>

            <div className="space-y-3">
              {analytics.topResources.map((item, idx) => (
                <div
                  key={item.resource.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {item.resource.name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {item.resource.category} • {item.resource.location}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-sky-600 dark:text-sky-400 text-sm">
                      {item.bookingsCount} {item.bookingsCount === 1 ? 'reservation' : 'reservations'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-slate-900 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading admin console...</p>
        </div>
      }
    >
      <AdminConsoleContent />
    </Suspense>
  );
}
