'use client';

import { useLabLend } from '@/lib/store';
import { ItemCondition } from '@/types';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
  Shield,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { Suspense, useState } from 'react';

function CheckInWizardContent() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const { bookings, resources, currentUser, checkInBooking } = useLabLend();

  const booking = bookings.find((b) => b.id === bookingId);
  const resource = resources.find((r) => r.id === booking?.resource_id);

  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [condition, setCondition] = useState<ItemCondition>('good');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState(
    resource?.photos[0] ||
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
  );
  const [checklist, setChecklist] = useState({
    cables_intact: true,
    safety_shields_ready: true,
    clean_and_calibrated: true,
    no_structural_damage: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!booking || !resource) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Booking Not Found</h2>
        <Link href="/bookings" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs">
          <ArrowLeft className="w-4 h-4" /> Back to My Bookings
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    checkInBooking(booking.id, {
      condition,
      notes: notes.trim() || 'Pre-session verification completed. Equipment ready for operation.',
      photo_paths: [photoUrl],
      checklist,
    });

    setTimeout(() => {
      router.push(`/booking/${booking.id}`);
    }, 600);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in py-4">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href={`/booking/${booking.id}`} className="hover:text-sky-600 flex items-center gap-1 font-medium transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Booking #{booking.id.slice(0, 8)}
        </Link>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <Camera className="w-4 h-4" />
            Stage 1: Pre-Session Condition Proofing
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Check-In &amp; Equipment Verification
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verify the physical status of <strong className="text-slate-800 dark:text-slate-200">{resource.name}</strong> before powering up. This protects you from being held liable for pre-existing defects.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Condition selector */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 dark:text-slate-200">
              1. Observed Initial Condition:
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'good', label: 'Good Condition', desc: 'No visible flaws', color: 'emerald' },
                { id: 'minor_wear', label: 'Minor Wear', desc: 'Cosmetic scratches', color: 'amber' },
                { id: 'damaged', label: 'Damaged / Defect', desc: 'Requires attention', color: 'rose' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCondition(opt.id as ItemCondition)}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                    condition === opt.id
                      ? opt.id === 'good'
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold ring-2 ring-emerald-500/30'
                        : opt.id === 'minor_wear'
                        ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold ring-2 ring-amber-500/30'
                        : 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-bold ring-2 ring-rose-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs font-bold">{opt.label}</span>
                  <span className="text-[10px] opacity-80 mt-1">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Verification Photo Upload */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 dark:text-slate-200">
              2. Photographic Condition Evidence (Camera / Upload):
            </label>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="h-44 rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-700 bg-slate-900">
                <img src={photoUrl} alt="Inspection Proof" className="w-full h-full object-cover" />
                <span className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded bg-slate-950/80 text-white">
                  Inspection Timestamp: {mounted ? new Date().toLocaleTimeString() : 'Current Session'}
                </span>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Photo URL or Mobile Camera Input:
                </label>
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Inspection Checklist */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 dark:text-slate-200">
              3. Operational Checklist:
            </label>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
              {[
                { key: 'cables_intact', label: 'Power & interface cables free of fraying or damage' },
                { key: 'safety_shields_ready', label: 'Safety shields, interlocks, and eye protection in place' },
                { key: 'clean_and_calibrated', label: 'Working surface is clean and ready for operation' },
                { key: 'no_structural_damage', label: 'No chassis cracks, loose fittings, or missing knobs' },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={checklist[item.key as keyof typeof checklist]}
                    onChange={(e) =>
                      setChecklist((prev) => ({
                        ...prev,
                        [item.key]: e.target.checked,
                      }))
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Inspector Notes */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              4. Additional Inspection Observations (Optional):
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Solder spool at 80% capacity, lenses wiped clean before power-up..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Confirm Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              'Recording Verified Check-In...'
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Confirm &amp; Begin Session (Check-In)
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading check-in wizard...</p>
        </div>
      }
    >
      <CheckInWizardContent />
    </Suspense>
  );
}
