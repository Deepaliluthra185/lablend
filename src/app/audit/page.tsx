'use client';

import { useLabLend } from '@/lib/store';
import { AuditLogEntry } from '@/types';
import {
  AlertCircle,
  Database,
  Download,
  FileCheck,
  History,
  Lock,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import React, { Suspense, useMemo, useState } from 'react';

function AuditLogContent() {
  const { auditLogs } = useLabLend();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedEntity, setSelectedEntity] = useState('all');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((entry) => {
      if (selectedAction !== 'all' && !entry.action.toLowerCase().includes(selectedAction.toLowerCase())) {
        return false;
      }
      if (selectedEntity !== 'all' && entry.entity_type.toLowerCase() !== selectedEntity.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesActor = entry.actor_name.toLowerCase().includes(q);
        const matchesAction = entry.action.toLowerCase().includes(q);
        const matchesDetail = (entry.detail || '').toLowerCase().includes(q);
        const matchesId = entry.entity_id.toLowerCase().includes(q);
        if (!matchesActor && !matchesAction && !matchesDetail && !matchesId) return false;
      }
      return true;
    });
  }, [auditLogs, selectedAction, selectedEntity, searchQuery]);

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Audit ID', 'Actor Name', 'Action', 'Entity Type', 'Entity ID', 'Booking ID', 'Detail'];
    const rows = filteredLogs.map((log) => [
      `"${log.created_at}"`,
      `"${log.id}"`,
      `"${log.actor_name.replace(/"/g, '""')}"`,
      `"${log.action}"`,
      `"${log.entity_type}"`,
      `"${log.entity_id}"`,
      `"${log.booking_id || ''}"`,
      `"${(log.detail || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lablend_campus_audit_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            <Database className="w-4 h-4" />
            Append-Only PostgreSQL Ledger
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Global Campus Audit Trail
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Immutable log of all reservation requests, owner approvals, condition checks, and incident resolutions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 font-bold text-xs transition shadow-sm"
        >
          <Download className="w-4 h-4" /> Export CSV ({filteredLogs.length} Records)
        </button>
      </div>

      {/* Append-Only Notice Banner */}
      <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-3">
        <Lock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold">Cryptographically &amp; Trigger-Protected Integrity</p>
          <p>
            The <code>audit_log</code> table in PostgreSQL is governed by database trigger <code>trg_audit_log_append_only</code> which raises an exception on any <code>UPDATE</code> or <code>DELETE</code> operation for all users, including administrators.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, actor, or details..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Action:</span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value="all">All Actions</option>
              <option value="BOOKING">Booking Events</option>
              <option value="CHECKED_IN">Check-Ins</option>
              <option value="RETURNED">Returns</option>
              <option value="INCIDENT">Incidents</option>
              <option value="QUALIFICATION">Qualifications</option>
              <option value="OWNER">Owner Status</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Entity:</span>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value="all">All Entities</option>
              <option value="booking">Bookings</option>
              <option value="resource">Resources</option>
              <option value="incident">Incidents</option>
              <option value="user_qualification">Qualifications</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Audit Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-sans text-xs">
                    {new Date(log.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-bold text-slate-900 dark:text-white font-sans text-xs">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-sans text-xs font-semibold text-sky-600 dark:text-sky-400">
                    {log.actor_name}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-sans text-xs capitalize">
                    {log.entity_type}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-sans text-xs max-w-md">
                    {log.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AuditPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading audit log...</p>
        </div>
      }
    >
      <AuditLogContent />
    </Suspense>
  );
}
