'use client';

import { checkEligibility } from '@/lib/domain';
import { useLabLend } from '@/lib/store';
import { Resource } from '@/types';
import {
  AlertCircle,
  Building,
  CheckCircle2,
  Clock,
  Cpu,
  Filter,
  Flame,
  HelpCircle,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';

const CATEGORIES = [
  { id: 'all', label: 'All Equipment & Spaces' },
  { id: 'makerspace', label: 'Makerspace' },
  { id: 'testing devices', label: 'Testing Devices' },
  { id: 'cameras', label: 'Cameras & Audio' },
  { id: 'labs', label: 'Specialized Labs' },
  { id: 'rooms', label: 'Seminar & Defense Rooms' },
];

const PROMPT_CHIPS = [
  'Measure a signal on Saturday',
  '3D print robotics chassis',
  'Film student interview video',
  'Laser cut 5mm acrylic sheet',
  'Presentation room with dual displays',
  'FPGA development station',
];

export default function DiscoverPage() {
  const { resources, currentUser, userQualifications, bookings } = useLabLend();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deptFilterOnly, setDeptFilterOnly] = useState(false);
  const [isSmartSearching, setIsSmartSearching] = useState(false);
  const [smartMatches, setSmartMatches] = useState<
    Array<{ resource: Resource; relevanceScore: number; matchReason: string }> | null
  >(null);

  // Natural language smart match execution
  const executeSmartMatch = async (queryText: string) => {
    if (!queryText.trim()) {
      setSmartMatches(null);
      return;
    }
    setIsSmartSearching(true);
    try {
      const res = await fetch('/api/smart-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          userDepartment: currentUser.department,
          allResources: resources,
        }),
      });
      const data = await res.json();
      if (data.matches && data.matches.length > 0) {
        setSmartMatches(data.matches);
      } else {
        setSmartMatches([]);
      }
    } catch {
      setSmartMatches([]);
    } finally {
      setIsSmartSearching(false);
    }
  };

  const handleSmartSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSmartMatch(searchQuery);
  };

  const clearSmartMatch = () => {
    setSearchQuery('');
    setSmartMatches(null);
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to compute quick eligibility for current user (testing tomorrow at 10:00)
  const getResourceEligibility = (resource: Resource) => {
    if (!mounted) {
      return { isEligible: true, checks: [] };
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const end = new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000);

    const userBookings = bookings.filter((b) => b.user_id === currentUser.id);

    return checkEligibility({
      resource,
      user: currentUser,
      userQualifications,
      requestedStart: tomorrow,
      requestedEnd: end,
      userBookings,
    });
  };

  // Filtered resources list
  const filteredResources = useMemo(() => {
    if (smartMatches !== null && smartMatches.length > 0) {
      return smartMatches.map((m) => m.resource);
    }

    return resources.filter((res) => {
      // Category filter
      if (selectedCategory !== 'all' && res.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      // Department filter
      if (
        deptFilterOnly &&
        res.department_restriction &&
        !currentUser.department?.toLowerCase().includes(res.department_restriction.toLowerCase())
      ) {
        return false;
      }
      // Text search
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = res.name.toLowerCase().includes(q);
        const matchesDesc = res.description.toLowerCase().includes(q);
        const matchesLoc = res.location.toLowerCase().includes(q);
        const matchesKeywords = res.keywords.some((k) => k.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesLoc && !matchesKeywords) return false;
      }
      return true;
    });
  }, [resources, smartMatches, selectedCategory, deptFilterOnly, searchQuery, currentUser]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header and User Context Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            <Sparkles className="w-4 h-4" />
            Verified Campus Inventory
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Discover Equipment & Spaces
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Browse certified equipment across campus labs. Real-time eligibility automatically checks your department and qualifications.
          </p>
        </div>

        <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl px-4 py-2.5 text-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
            {currentUser.full_name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">
              {currentUser.full_name} ({currentUser.department})
            </div>
            <div className="text-slate-500 text-[11px]">
              Trust: <strong className="text-emerald-600">{currentUser.trust_score}/100</strong> •{' '}
              {userQualifications.filter((q) => q.user_id === currentUser.id && q.status === 'verified').length} verified certs
            </div>
          </div>
        </div>
      </div>

      {/* AI Smart Match Natural Language Search Box */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-sky-700/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h2 className="font-bold text-base sm:text-lg">AI Smart Matching & Task Search</h2>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
            Gemini Assisted
          </span>
        </div>

        <form onSubmit={handleSmartSearchSubmit} className="relative flex items-center">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Describe what you want to do (e.g. 'I need to measure a 50MHz signal on Saturday')..."
            className="w-full pl-12 pr-28 py-3.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition"
          />
          <button
            type="submit"
            disabled={isSmartSearching || !searchQuery.trim()}
            className="absolute right-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition"
          >
            {isSmartSearching ? 'Matching...' : 'Find Matches'}
          </button>
        </form>

        {/* Prompt suggestion chips */}
        <div className="space-y-1.5">
          <p className="text-[11px] text-slate-400">Suggested tasks:</p>
          <div className="flex flex-wrap gap-2">
            {PROMPT_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setSearchQuery(chip);
                  executeSmartMatch(chip);
                }}
                className="text-[11px] px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-sky-500/40 transition"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Smart search active filter banner */}
        {smartMatches !== null && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-sky-300">
            <span>
              Showing {smartMatches.length} smart {smartMatches.length === 1 ? 'match' : 'matches'} for: &ldquo;{searchQuery}&rdquo;
            </span>
            <button
              type="button"
              onClick={clearSmartMatch}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
            >
              <X className="w-3.5 h-3.5" /> Clear Smart Match
            </button>
          </div>
        )}
      </div>

      {/* Category Pills & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.id);
                setSmartMatches(null);
              }}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedCategory === cat.id && smartMatches === null
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={deptFilterOnly}
              onChange={(e) => setDeptFilterOnly(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
            />
            <span>Eligible for my dept only ({currentUser.department})</span>
          </label>
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">No resources found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search keywords, clearing category filters, or switching demo personas to see department-restricted items.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setDeptFilterOnly(false);
              clearSmartMatch();
            }}
            className="px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500 transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredResources.map((resource) => {
            const eligibility = getResourceEligibility(resource);
            const smartMatchInfo = smartMatches?.find((m) => m.resource.id === resource.id);

            return (
              <div
                key={resource.id}
                className="group flex flex-col justify-between rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-sky-500/50 transition duration-300"
              >
                <div>
                  {/* Photo container with badges */}
                  <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={resource.photos[0]}
                      alt={resource.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />

                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur">
                        {resource.category}
                      </span>
                      {resource.supervision_required && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold">
                          Supervised
                        </span>
                      )}
                    </div>

                    {smartMatchInfo && (
                      <span className="absolute top-2.5 right-2.5 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-500 text-slate-950 shadow-md">
                        {smartMatchInfo.relevanceScore}% Match
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    {smartMatchInfo && (
                      <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium bg-sky-50 dark:bg-sky-950/60 p-2 rounded-lg border border-sky-200 dark:border-sky-800">
                        💡 {smartMatchInfo.matchReason}
                      </p>
                    )}

                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-sky-600 transition">
                        {resource.name}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{resource.location}</span>
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {resource.description}
                    </p>

                    {/* Operational Specs */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{resource.open_hour}:00 - {resource.close_hour}:00</span>
                      </div>
                      <div>
                        <span>Max {resource.max_hours_per_booking}h / booking</span>
                      </div>
                    </div>

                    {/* Real-Time Personalized Eligibility Badge */}
                    <div className="pt-1">
                      {eligibility.isEligible ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Eligible to Request</span>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/60">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">
                            {eligibility.checks.find((c) => !c.ok)?.reason || 'Prerequisite conditions not satisfied'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 pt-0">
                  <Link
                    href={`/resource/${resource.id}`}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-sky-600 dark:hover:bg-sky-400 text-white dark:text-slate-900 hover:text-white dark:hover:text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    View Details & Eligibility Checklist →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
