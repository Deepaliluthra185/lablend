'use client';

import { useLabLend } from '@/lib/store';
import { IncidentSeverity, IncidentType, ItemCondition } from '@/types';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  FileCheck,
  ShieldAlert,
  Sparkles,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { Suspense, useState } from 'react';

function ReturnWizardContent() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const { bookings, resources, currentUser, returnBooking } = useLabLend();

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
    cleaned_after_use: true,
    cables_stored: true,
    power_switched_off: true,
    workstation_cleared: true,
  });

  // Incident reporting state
  const [reportIncident, setReportIncident] = useState(false);
  const [incidentType, setIncidentType] = useState<IncidentType>('damage');
  const [incidentSeverity, setIncidentSeverity] = useState<IncidentSeverity>('minor');
  const [incidentDesc, setIncidentDesc] = useState('');

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

  // Check if late return
  const isLate = mounted ? Date.now() > new Date(booking.end_at).getTime() + 10 * 60 * 1000 : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const incidentData =
      condition === 'damaged' || reportIncident
        ? {
            type: incidentType,
            severity: incidentSeverity,
            description:
              incidentDesc.trim() ||
              notes.trim() ||
              `Equipment returned in ${condition} state during return inspection.`,
          }
        : undefined;

    returnBooking(
      booking.id,
      {
        condition,
        notes: notes.trim() || 'Post-session return inspection completed.',
        photo_paths: [photoUrl],
        checklist,
      },
      incidentData
    );

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
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <FileCheck className="w-4 h-4" />
            Stage 2: Post-Session Handback &amp; Audit Proofing
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Confirm Equipment Return
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete the final condition report for <strong className="text-slate-800 dark:text-slate-200">{resource.name}</strong>. Both before and after reports are timestamped and preserved in the append-only audit trail.
          </p>
        </div>

        {/* Late Return Warning */}
        {isLate && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Late Return Detected
            </p>
            <p>
              Your reservation ended at {new Date(booking.end_at).toLocaleTimeString()}. Completing return past the 10-minute grace window increments your late return count on your campus profile (+2 fair-share points).
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Condition selector */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 dark:text-slate-200">
              1. Equipment Condition upon Return:
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'good', label: 'Good & Clean', desc: 'No flaws or issues', color: 'emerald' },
                { id: 'minor_wear', label: 'Minor Wear', desc: 'Slight cosmetic marks', color: 'amber' },
                { id: 'damaged', label: 'Damaged / Defect', desc: 'Triggers incident log', color: 'rose' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setCondition(opt.id as ItemCondition);
                    if (opt.id === 'damaged') setReportIncident(true);
                  }}
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

          {/* Photo evidence upload */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 dark:text-slate-200">
              2. Return Handback Photo (Camera / Proof):
            </label>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="h-44 rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-700 bg-slate-900">
                <img src={photoUrl} alt="Return Proof" className="w-full h-full object-cover" />
                <span className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded bg-slate-950/80 text-white">
                  Return Timestamp: {mounted ? new Date().toLocaleTimeString() : 'Current Session'}
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

          {/* Checklist */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 dark:text-slate-200">
              3. Work Area &amp; Storage Checklist:
            </label>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
              {[
                { key: 'cleaned_after_use', label: 'Equipment and work area cleaned of debris/dust/flux' },
                { key: 'cables_stored', label: 'All cables, probes, and accessories coiled in storage case' },
                { key: 'power_switched_off', label: 'Main power switched off and cooling cycle finished' },
                { key: 'workstation_cleared', label: 'Workstation cleared for the next scheduled student' },
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
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Incident reporting section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={reportIncident || condition === 'damaged'}
                onChange={(e) => setReportIncident(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-4 h-4" />
                Report an Incident (Damage, Delay, Conflict, Misuse, Safety)
              </span>
            </label>

            {(reportIncident || condition === 'damaged') && (
              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3 animate-fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Incident Category:
                    </label>
                    <select
                      value={incidentType}
                      onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-slate-900 dark:text-white"
                    >
                      <option value="damage">Damage (Component / Chassis)</option>
                      <option value="delay">Delay (Extended handoff)</option>
                      <option value="conflict">Conflict (Double-booked bench)</option>
                      <option value="misuse">Misuse / Policy deviation</option>
                      <option value="safety">Safety hazard / Ventilation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Severity:
                    </label>
                    <select
                      value={incidentSeverity}
                      onChange={(e) => setIncidentSeverity(e.target.value as IncidentSeverity)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-slate-900 dark:text-white"
                    >
                      <option value="minor">Minor (Consumable / Cosmetic)</option>
                      <option value="major">Major (Equipment inoperable)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Describe What Happened:
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={incidentDesc}
                    onChange={(e) => setIncidentDesc(e.target.value)}
                    placeholder="Transparent description of how the damage or delay occurred..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Note: Self-reporting promptly is taken into account by facility owners and prevents automatic trust deductions.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Final Session Notes (Optional):
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Printing run completed smoothly, chamber cooled down to 25°C..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              'Submitting Handback & Audit Records...'
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Confirm Return &amp; Complete Handback
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading return wizard...</p>
        </div>
      }
    >
      <ReturnWizardContent />
    </Suspense>
  );
}
