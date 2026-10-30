'use client';

import { useLabLend } from '@/lib/store';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Cpu,
  FileCheck,
  Flame,
  Layers,
  Lock,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function LandingPage() {
  const router = useRouter();
  const { allUsers, switchUserById, resources, bookings, currentUser } = useLabLend();

  const handleQuickLogin = (userId: string, redirectPath: string = '/discover') => {
    switchUserById(userId);
    router.push(redirectPath);
  };

  return (
    <div className="space-y-16 py-4 animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white p-8 sm:p-12 lg:p-16 border border-sky-800/40 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Next-Gen Campus Resource Sharing
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Unlock underused campus labs, makerspaces & gear.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            A trust-first institutional platform where verified equipment owners list resources,
            students gain certified access, fair-share rules eliminate booking hoarding, and condition
            handbacks stay fully accountable.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition shadow-lg shadow-sky-500/25"
            >
              Explore Equipment & Spaces
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#try-demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-medium border border-slate-700 transition"
            >
              One-Click Demo Roles
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-slate-800 text-xs">
            <div>
              <p className="text-2xl font-bold text-sky-400">8</p>
              <p className="text-slate-400">Certified Campus Assets</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">8h / 7d</p>
              <p className="text-slate-400">Fair-Use Rolling Cap</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">100%</p>
              <p className="text-slate-400">Human-Verified Decisions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">Append-Only</p>
              <p className="text-slate-400">Immutable Audit Trail</p>
            </div>
          </div>
        </div>
      </section>

      {/* ONE-CLICK DEMO LOGIN SECTION (CRITICAL FOR JUDGES) */}
      <section id="try-demo" className="space-y-6 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              <ShieldCheck className="w-4 h-4" />
              Instant Hackathon Judge Launchpad
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Try the Demo with One Click
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Test each campus role instantly without creating accounts or passwords.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Active session: <span className="font-semibold text-slate-900 dark:text-white">{currentUser.full_name}</span> ({currentUser.role})
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Student Aarav */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-sky-500/50 transition flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">Aarav Patel</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  STUDENT (ECE)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Has verified 3D-Printer and Oscilloscope training. Has 7h recent usage in last 7 days (ready to test 8h weekly cap!).
              </p>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>Trust Score: <strong className="text-emerald-600">88</strong></span>
                <span>•</span>
                <span>Recent Usage: <strong>7.0h / 8h</strong></span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleQuickLogin('11111111-1111-1111-1111-111111111111', '/discover')}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              Login as Aarav (Certified Student) →
            </button>
          </div>

          {/* 2. Student Riya */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-sky-500/50 transition flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">Riya Sharma</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  STUDENT (CSE)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                CSE student without safety qualifications yet. Ideal for testing eligibility rejection checklist and requesting certificates.
              </p>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>Trust Score: <strong className="text-emerald-600">80</strong></span>
                <span>•</span>
                <span>0 Qualifications</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleQuickLogin('22222222-2222-2222-2222-222222222222', '/discover')}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              Login as Riya (New Student) →
            </button>
          </div>

          {/* 3. Student Kabir */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-sky-500/50 transition flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">Kabir Sen</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  STUDENT (ECE)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Has 1 late return, 1 late cancel, and 1 resolved minor damage incident on record. Triggers "Review suggested" owner flags.
              </p>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>Trust Score: <strong className="text-amber-600">72</strong></span>
                <span>•</span>
                <span>1 Incident on file</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleQuickLogin('33333333-3333-3333-3333-333333333333', '/bookings')}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              Login as Kabir (History & Incident) →
            </button>
          </div>

          {/* 4. Owner Dr. Mehta */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-sky-500/50 transition flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">Dr. Anita Mehta</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  VERIFIED OWNER
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Facility manager for Mechanical & Makerspace. Manages 3D printer, laser cutter, oscilloscope, seminar room, and incident queue.
              </p>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>Role: <strong>Facility Manager</strong></span>
                <span>•</span>
                <span>Verified: <strong className="text-emerald-600">Yes</strong></span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleQuickLogin('44444444-4444-4444-4444-444444444444', '/owner')}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              Login as Dr. Mehta (Owner Dashboard) →
            </button>
          </div>

          {/* 5. Owner Prof. Rao */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-sky-500/50 transition flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">Prof. Suresh Rao</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                  UNVERIFIED OWNER
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                ECE Lab manager with unverified owner status. Test admin owner verification workflow in Admin Console.
              </p>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>Role: <strong>Faculty Owner</strong></span>
                <span>•</span>
                <span>Verified: <strong className="text-rose-600">No (Pending)</strong></span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleQuickLogin('55555555-5555-5555-5555-555555555555', '/owner')}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              Login as Prof. Rao (Unverified Owner) →
            </button>
          </div>

          {/* 6. Admin Elena Vance */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-sky-500/50 transition flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">Elena Vance (Admin)</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                  CAMPUS ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Campus Operations administrator. Has global audit log with CSV export, owner verification, qualification verification, and analytics.
              </p>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>Access: <strong>Full Campus Authority</strong></span>
                <span>•</span>
                <span>Audit: <strong>Append-Only</strong></span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleQuickLogin('99999999-9999-9999-9999-999999999999', '/admin')}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              Login as Admin (Campus Console) →
            </button>
          </div>
        </div>
      </section>

      {/* The 4-Step Campus Trust Loop */}
      <section className="space-y-8 pt-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            Protocol Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            How LabLend Solves Institutional Resource Gridlock
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Traditional spreadsheets and departmental silos lead to hoarding, broken equipment, and zero accountability.
            LabLend enforces four algorithmic trust boundaries:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">1. Eligibility Engine</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every request automatically verifies 8 checks: department alignment, prerequisite safety certifications, facility hours, blackouts, and max duration limits.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">2. Fair-Share Waitlist</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Score = 7d Usage + 2×Late + 1×LateCancel. Lower score gets queue priority. If an approved slot is cancelled, the top waitlist entry auto-promotes to pending.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">3. Condition Proofing</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Mandatory before/after photo check-in and return checklists. Prevents finger-pointing when equipment is damaged or left uncalibrated.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">4. Append-Only Audit</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every status change, override, and AI suggestion is stamped into an immutable audit table protected by PostgreSQL triggers blocking UPDATE and DELETE.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Resources Preview */}
      <section className="space-y-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Campus Inventory Spotlight
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Live equipment ready for verified booking across central labs.
            </p>
          </div>
          <Link
            href="/discover"
            className="text-xs sm:text-sm font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            View all 8 listings →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {resources.slice(0, 4).map((res) => (
            <Link
              key={res.id}
              href={`/resource/${res.id}`}
              className="group block rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition"
            >
              <div className="h-40 overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                <img
                  src={res.photos[0]}
                  alt={res.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <span className="absolute top-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur">
                  {res.category}
                </span>
              </div>
              <div className="p-4 space-y-1.5">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-sky-600 transition truncate">
                  {res.name}
                </h3>
                <p className="text-xs text-slate-500 truncate">{res.location}</p>
                <div className="flex items-center justify-between pt-2 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  <span>Max: {res.max_hours_per_booking}h / booking</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Available</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
