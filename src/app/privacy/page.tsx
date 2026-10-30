import { AlertCircle, CheckCircle, Database, EyeOff, Lock, Shield } from 'lucide-react';
import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 animate-fade-in">
      <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
          <Shield className="w-4 h-4" />
          Campus Governance & Data Minimization Notice
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          LabLend Campus Privacy & Data Policy
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          LabLend operates under strict university privacy guidelines designed to eliminate unnecessary personal tracking while guaranteeing equipment safety and peer fairness.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data Minimization */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <EyeOff className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 dark:text-white text-base">
            1. Data Minimization Principles
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            We store only minimal identifiers required for campus accountability: student/faculty ID number, institutional email, academic department, and verified qualification records.
            We never store social security numbers, private phone numbers, or external financial records.
          </p>
        </div>

        {/* Private Storage Buckets */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 dark:text-white text-base">
            2. Private Storage & Signed URLs
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Condition photos and qualification evidence certificates are kept in private Supabase Storage buckets. Access is restricted via Row Level Security (RLS) to the booking user, the asset owner, and authorized campus operations admins via short-lived signed URLs.
          </p>
        </div>

        {/* Append-Only Audit Log */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 dark:text-white text-base">
            3. Append-Only Accountability
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            To prevent arbitrary retribution or administrative tampering, every booking status change, cancellation reason, and incident resolution is written to an immutable PostgreSQL table. UPDATE and DELETE actions are forbidden by database-level triggers.
          </p>
        </div>

        {/* Human Oversight on AI */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 dark:text-white text-base">
            4. Absolute Human-in-the-Loop Decisions
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            AI models (Gemini API) are restricted to consultative assistance: parsing queries and summarizing damage reports. AI never bans users, assesses financial penalties, or rejects booking requests autonomously. Every decision requires a human owner or administrator.
          </p>
        </div>
      </div>

      <div className="p-5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-200 space-y-1">
        <p className="font-semibold flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          Campus Compliance Notice
        </p>
        <p>
          Students or faculty wishing to review their complete institutional loan ledger or request an official qualification audit may contact Campus Operations (Elena Vance, ADM-OP-001) or review the public Audit Log.
        </p>
      </div>
    </div>
  );
}
