'use client';

import { computeFairShareScore, getRolling7DayUsageHours } from '@/lib/domain';
import { useLabLend } from '@/lib/store';
import {
  AlertCircle,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  FileCheck,
  Flame,
  Layers,
  Lock,
  Plus,
  RotateCcw,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import React, { Suspense, useMemo, useState } from 'react';

function ProfileContent() {
  const {
    currentUser,
    bookings,
    qualifications,
    userQualifications,
    requestQualificationVerification,
  } = useLabLend();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedQualId, setSelectedQualId] = useState(qualifications[0]?.id || '');
  const [certFileName, setCertFileName] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const userBookings = useMemo(() => {
    return bookings.filter((b) => b.user_id === currentUser.id);
  }, [bookings, currentUser.id]);

  const rolling7dUsage = useMemo(() => {
    if (!mounted) return 0;
    return Math.round(getRolling7DayUsageHours(userBookings, new Date()) * 10) / 10;
  }, [userBookings, mounted]);

  const fairShare = useMemo(() => {
    if (!mounted) {
      return { score: 0, breakdown: { hoursUsed7d: 0, lateCount: 0, lateCancelCount: 0 } };
    }
    return computeFairShareScore(currentUser, userBookings, new Date());
  }, [currentUser, userBookings, mounted]);

  const myQualifications = useMemo(() => {
    return userQualifications.filter((uq) => uq.user_id === currentUser.id);
  }, [userQualifications, currentUser.id]);

  const handleUploadCert = (e: React.FormEvent) => {
    e.preventDefault();
    requestQualificationVerification(
      selectedQualId,
      certFileName || `certificate_${currentUser.id_number}_training.pdf`
    );
    setUploadSuccess(true);
    setTimeout(() => {
      setShowUploadModal(false);
      setUploadSuccess(false);
      setCertFileName('');
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in py-4">
      {/* Header Profile Identity */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-sky-500/20">
            {currentUser.full_name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {currentUser.full_name}
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Department of {currentUser.department} • ID: <strong className="text-slate-700 dark:text-slate-300">{currentUser.id_number}</strong>
            </p>
            <p className="text-xs text-slate-400">{currentUser.email}</p>
          </div>
        </div>

        {/* Trust Score & Owner Verification Badges */}
        <div className="flex items-center gap-3">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-0.5">
            <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
              Campus Trust Score
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {currentUser.trust_score}
            </span>
            <span className="text-[10px] text-emerald-600 block">/ 100 max</span>
          </div>

          {currentUser.owner_verified && (
            <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-center space-y-0.5">
              <ShieldCheck className="w-5 h-5 text-purple-600 mx-auto" />
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 block">
                Verified Owner
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Fair-Use Meter & Fair-Share Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fair-Use Weekly Meter */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-600" />
              Rolling 7-Day Fair-Use Meter
            </span>
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
              {rolling7dUsage}h / 8.0h Cap
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                rolling7dUsage >= 8
                  ? 'bg-rose-500'
                  : rolling7dUsage >= 6
                  ? 'bg-amber-500'
                  : 'bg-sky-500'
              }`}
              style={{ width: `${Math.min(100, (rolling7dUsage / 8) * 100)}%` }}
            />
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Campus Rule #2: Each member is allotted <strong>8 hours</strong> of equipment time in a rolling 7-day window to prevent hoarding. Once your sessions clear 7 days, your available allocation automatically restores.
          </p>
        </div>

        {/* Fair-Share Priority Queue Score */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-600" />
              Fair-Share Waitlist Score
            </span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              {fairShare.score} points
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] text-slate-400 block">7d Usage</span>
              <strong className="text-slate-800 dark:text-slate-200">{fairShare.breakdown.hoursUsed7d}h</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] text-slate-400 block">Late Returns</span>
              <strong className="text-slate-800 dark:text-slate-200">+{currentUser.late_count * 2}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] text-slate-400 block">Late Cancels</span>
              <strong className="text-slate-800 dark:text-slate-200">+{currentUser.late_cancel_count * 1}</strong>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            In competitive time conflicts, students with lower scores receive priority in waitlist promotions.
          </p>
        </div>
      </div>

      {/* Safety Qualifications & Certificate Evidence */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-sky-600" />
              Verified Safety Qualifications
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Certain specialized equipment (3D printers, laser cutters, high-voltage oscilloscopes) requires certified training.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" /> Request New Qualification
          </button>
        </div>

        {myQualifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 space-y-2">
            <p>No safety qualifications recorded for this profile yet.</p>
            <p className="text-[11px] text-slate-400">
              Click &ldquo;Request New Qualification&rdquo; to submit orientation certificates for admin review.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myQualifications.map((uq) => {
              const qual = qualifications.find((q) => q.id === uq.qualification_id);
              return (
                <div
                  key={uq.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {qual?.name || 'Safety Qualification'}
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
                  <p className="text-slate-500 text-[11px] line-clamp-2">{qual?.description}</p>
                  {uq.reviewed_at && (
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                      Verified by Faculty Manager on {new Date(uq.reviewed_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* UPLOAD QUALIFICATION MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-fade-in text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-sky-600" />
                Upload Training Certificate
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadCert} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Qualification:
                </label>
                <select
                  value={selectedQualId}
                  onChange={(e) => setSelectedQualId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {qualifications.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Certificate File Name / Credential ID:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. laser_safety_cert_oct2026.pdf"
                  value={certFileName}
                  onChange={(e) => setCertFileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center space-y-1">
                <FileCheck className="w-8 h-8 text-sky-600 mx-auto" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Select PDF / Document Evidence
                </p>
                <p className="text-[10px] text-slate-400">Encrypted in private storage bucket</p>
              </div>

              {uploadSuccess ? (
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold text-center">
                  Certificate uploaded successfully! Pending admin verification.
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold"
                  >
                    Submit for Review
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-sky-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading profile and qualifications...</p>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
