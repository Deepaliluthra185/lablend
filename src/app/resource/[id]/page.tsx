'use client';

import {
  checkEligibility,
  checkWeeklyCap,
  computeFairShareScore,
  detectConflict,
  getRolling7DayUsageHours,
} from '@/lib/domain';
import { useLabLend } from '@/lib/store';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Award,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  Flame,
  Info,
  Lock,
  RotateCw,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { Suspense, useMemo, useState } from 'react';

function ResourceDetailContent() {
  const params = useParams();
  const router = useRouter();
  const resourceId = params.id as string;

  const {
    resources,
    currentUser,
    userQualifications,
    bookings,
    requestBooking,
    requestQualificationVerification,
  } = useLabLend();

  const resource = resources.find((r) => r.id === resourceId);

  const [mounted, setMounted] = useState(false);
  const [bookingDate, setBookingDate] = useState('2026-11-01');
  const [startHourVal, setStartHourVal] = useState('10');
  const [durationVal, setDurationVal] = useState('2');

  React.useEffect(() => {
    setMounted(true);
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setBookingDate(d.toISOString().split('T')[0]);
  }, []);
  const [purpose, setPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingFeedback, setBookingFeedback] = useState<{
    success: boolean;
    message: string;
    waitlisted?: boolean;
    bookingId?: string;
  } | null>(null);

  // Modal / Evidence Upload state
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceFileName, setEvidenceFileName] = useState('');
  const [evidenceSubmitted, setEvidenceSubmitted] = useState(false);

  if (!resource) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Resource Not Found</h2>
        <p className="text-sm text-slate-500">The requested equipment or space listing could not be found.</p>
        <Link href="/discover" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Discover
        </Link>
      </div>
    );
  }

  // Calculate requested start and end Date objects
  const candidateStart = useMemo(() => {
    const d = new Date(`${bookingDate}T00:00:00`);
    d.setHours(parseInt(startHourVal, 10), 0, 0, 0);
    return d;
  }, [bookingDate, startHourVal]);

  const candidateEnd = useMemo(() => {
    return new Date(candidateStart.getTime() + parseFloat(durationVal) * 60 * 60 * 1000);
  }, [candidateStart, durationVal]);

  // Compute live eligibility checklist
  const userBookings = useMemo(() => {
    return bookings.filter((b) => b.user_id === currentUser.id);
  }, [bookings, currentUser.id]);

  const eligibility = useMemo(() => {
    return checkEligibility({
      resource,
      user: currentUser,
      userQualifications,
      requestedStart: candidateStart,
      requestedEnd: candidateEnd,
      userBookings,
      weeklyCapHours: 8,
    });
  }, [resource, currentUser, userQualifications, candidateStart, candidateEnd, userBookings]);

  // Conflict detection & free slot suggestions
  const conflict = useMemo(() => {
    return detectConflict(bookings, candidateStart, candidateEnd, resource);
  }, [bookings, candidateStart, candidateEnd, resource]);

  // User fair-share score
  const fairShare = useMemo(() => {
    return computeFairShareScore(currentUser, userBookings, candidateStart);
  }, [currentUser, userBookings, candidateStart]);

  // Rolling 7-day usage
  const rolling7dUsage = useMemo(() => {
    return getRolling7DayUsageHours(userBookings, candidateStart, resource.id);
  }, [userBookings, candidateStart, resource.id]);

  // Handle Request Submission
  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eligibility.isEligible) return;

    setIsSubmitting(true);
    try {
      const res = requestBooking({
        resource_id: resource.id,
        start_at: candidateStart.toISOString(),
        end_at: candidateEnd.toISOString(),
        purpose: purpose.trim() || 'Academic coursework and prototyping',
      });

      setBookingFeedback({
        success: true,
        waitlisted: res.waitlisted,
        message: res.waitlisted
          ? 'Time slot conflict detected with an existing reservation. Your request has been queued in the Fair-Share Waitlist with your current priority score.'
          : 'Booking request submitted successfully! Awaiting human owner verification.',
        bookingId: res.booking.id,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit request';
      setBookingFeedback({
        success: false,
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Evidence Submission for missing qualification
  const handleEvidenceUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resource.required_qualification_id) return;
    requestQualificationVerification(
      resource.required_qualification_id,
      evidenceFileName || `cert_${currentUser.id_number}_training.pdf`
    );
    setEvidenceSubmitted(true);
    setTimeout(() => {
      setShowEvidenceModal(false);
      setEvidenceSubmitted(false);
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/discover" className="hover:text-sky-600 flex items-center gap-1 font-medium transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Discover
        </Link>
        <span>/</span>
        <span className="capitalize">{resource.category}</span>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-semibold truncate">{resource.name}</span>
      </div>

      {/* Main Grid: Left Details & Right Form/Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Resource Details, Specs, Owner Info */}
        <div className="lg:col-span-7 space-y-6">
          {/* Photo banner */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
            <img
              src={resource.photos[0]}
              alt={resource.name}
              className="w-full h-72 sm:h-96 object-cover"
            />
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-950/80 text-white backdrop-blur border border-white/10">
                {resource.category}
              </span>
              {resource.supervision_required && (
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500 text-slate-950">
                  Technician Supervision Required
                </span>
              )}
              {resource.department_restriction && (
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-600 text-white">
                  Restricted to {resource.department_restriction}
                </span>
              )}
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {resource.name}
            </h1>
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-sky-600" />
              <span>{resource.location}</span>
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-2">
              {resource.description}
            </p>

            {/* Operating specs badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 block text-[11px]">Facility Hours</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {resource.open_hour}:00 - {resource.close_hour}:00
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 block text-[11px]">Max Per Session</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {resource.max_hours_per_booking} Hours
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[11px]">Rolling 7d Cap</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  8 Hours Fair-Use
                </span>
              </div>
            </div>
          </div>

          {/* Usage Rules & Deposit Notes */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-600" />
              Safety Protocols & Lab Rules
            </h3>
            {resource.usage_rules && (
              <div className="text-xs text-slate-600 dark:text-slate-300 bg-sky-50 dark:bg-sky-950/40 p-3.5 rounded-xl border border-sky-100 dark:border-sky-900/60 leading-relaxed">
                <strong className="block text-sky-800 dark:text-sky-300 mb-1">Standard Operating Rules:</strong>
                {resource.usage_rules}
              </div>
            )}
            {resource.deposit_note && (
              <div className="text-xs text-slate-600 dark:text-slate-300 bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-100 dark:border-amber-900/60 leading-relaxed">
                <strong className="block text-amber-800 dark:text-amber-300 mb-1">Check-in Verification Notice:</strong>
                {resource.deposit_note}
              </div>
            )}
          </div>

          {/* Facility Ownership & Accountability */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-base">
                DM
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Dr. Anita Mehta</span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    <ShieldCheck className="w-3 h-3" /> Verified Owner
                  </span>
                </div>
                <p className="text-xs text-slate-500">Faculty Manager • Mechanical & Prototyping Labs</p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 hidden sm:block">
              <span>Human Decisions Required</span>
              <p className="text-[11px] text-slate-400">Reviews reasons & condition reports</p>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Eligibility Checklist & Booking Reservation Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Time Slot Selection & Dynamic Eligibility Engine */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-600" />
                Reserve Session
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure your requested time. The eligibility engine evaluates your permission in real time.
              </p>
            </div>

            {/* Time Configuration Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reservation Date
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  min={mounted ? new Date().toISOString().split('T')[0] : '2026-10-30'}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <select
                    value={startHourVal}
                    onChange={(e) => setStartHourVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {Array.from({ length: 14 }).map((_, i) => {
                      const hour = 8 + i;
                      return (
                        <option key={hour} value={hour}>
                          {hour < 10 ? `0${hour}:00` : `${hour}:00`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Hours)
                  </label>
                  <select
                    value={durationVal}
                    onChange={(e) => setDurationVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {Array.from({ length: resource.max_hours_per_booking }).map((_, i) => {
                      const h = i + 1;
                      return (
                        <option key={h} value={h}>
                          {h} {h === 1 ? 'Hour' : 'Hours'}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* REAL-TIME ELIGIBILITY CHECKLIST */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-sky-600" />
                  Eligibility Checklist (8 Rules)
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    eligibility.isEligible
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {eligibility.isEligible ? 'ALL CHECKS PASSED' : 'CHECK FAILED'}
                </span>
              </div>

              <div className="space-y-2">
                {eligibility.checks.map((check, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition ${
                      check.ok
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-slate-700 dark:text-slate-300'
                        : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    {check.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5 flex-1">
                      <div className="font-semibold text-[11px] flex items-center justify-between">
                        <span>{check.label}</span>
                        {check.label === 'Safety Certification' && !check.ok && (
                          <button
                            type="button"
                            onClick={() => setShowEvidenceModal(true)}
                            className="text-sky-600 dark:text-sky-400 hover:underline font-bold text-[10px] flex items-center gap-1"
                          >
                            <Upload className="w-3 h-3" /> Upload Evidence
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] leading-tight opacity-90">{check.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CONFLICT PREVIEW & FAIR-SHARE WAITLIST CARD */}
            {conflict.hasConflict && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-3 animate-fade-in">
                <div className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span>Time Slot Already Reserved</span>
                    <p className="font-normal text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                      An approved booking currently holds this time. If you submit, you will be auto-waitlisted with your fair-share score:
                      <strong className="ml-1 text-slate-900 dark:text-white">{fairShare.score} points</strong> (Lower score gets priority).
                    </p>
                  </div>
                </div>

                {conflict.suggestedSlots.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-amber-200 dark:border-amber-800/60">
                    <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 block">
                      3 Nearest Free Slots:
                    </span>
                    <div className="space-y-1">
                      {conflict.suggestedSlots.map((slot, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => {
                            setBookingDate(slot.start.toISOString().split('T')[0]);
                            setStartHourVal(slot.start.getHours().toString());
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 hover:border-amber-500 text-[11px] text-slate-700 dark:text-slate-300 flex items-center justify-between transition"
                        >
                          <span>
                            {slot.start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
                            at {slot.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                            {slot.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                            Select slot →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Purpose & Request Form */}
            <form onSubmit={handleSubmitBooking} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Purpose of Booking (Required for Owner Review)
                </label>
                <textarea
                  rows={2}
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Explain your academic coursework, research goal, or testing plan..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder-slate-400"
                />
              </div>

              {/* Booking Feedback Banner */}
              {bookingFeedback && (
                <div
                  className={`p-3.5 rounded-xl text-xs space-y-1.5 ${
                    bookingFeedback.success
                      ? bookingFeedback.waitlisted
                        ? 'bg-amber-50 dark:bg-amber-950/50 border border-amber-300 text-amber-900 dark:text-amber-200'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-300 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  <p className="font-bold flex items-center gap-1.5">
                    {bookingFeedback.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    )}
                    {bookingFeedback.waitlisted ? 'Queued in Waitlist' : 'Reservation Submitted'}
                  </p>
                  <p>{bookingFeedback.message}</p>
                  {bookingFeedback.success && (
                    <Link
                      href="/bookings"
                      className="inline-block pt-1 font-bold underline text-sky-700 dark:text-sky-300 hover:text-sky-900"
                    >
                      View in My Bookings & Track Timeline →
                    </Link>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!eligibility.isEligible || isSubmitting}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-md ${
                  eligibility.isEligible
                    ? conflict.hasConflict
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                      : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/25'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  'Submitting Request...'
                ) : !eligibility.isEligible ? (
                  'Resolve Eligibility Checklist Items Above'
                ) : conflict.hasConflict ? (
                  'Join Fair-Share Waitlist'
                ) : (
                  'Request Booking'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* MODAL: Upload Safety Qualification Evidence */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-sky-600" />
                Upload Training Certificate
              </h3>
              <button
                type="button"
                onClick={() => setShowEvidenceModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Upload your safety training completion certificate or proof of lab orientation. Campus admins verify requests within 24 hours.
            </p>

            <form onSubmit={handleEvidenceUpload} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Evidence File Name / Certificate ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3d_printer_safety_cert_2026.pdf"
                  value={evidenceFileName}
                  onChange={(e) => setEvidenceFileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center space-y-1">
                <FileCheck className="w-8 h-8 text-sky-600 mx-auto" />
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Simulated Camera / Document Upload
                </p>
                <p className="text-[10px] text-slate-400">PDF, JPG, PNG up to 10MB</p>
              </div>

              {evidenceSubmitted ? (
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold text-center">
                  Certificate submitted! Pending admin review.
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEvidenceModal(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold"
                  >
                    Submit Evidence
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

export default function ResourceDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-sky-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading campus resource specifications...</p>
        </div>
      }
    >
      <ResourceDetailContent />
    </Suspense>
  );
}
