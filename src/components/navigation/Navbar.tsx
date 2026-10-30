'use client';

import { useLabLend } from '@/lib/store';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Cpu,
  Layers,
  LayoutDashboard,
  LogOut,
  Moon,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  Sun,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const {
    currentUser,
    allUsers,
    switchUserById,
    notifications,
    markNotificationRead,
    resetToSeedData,
  } = useLabLend();

  const [notifOpen, setNotifOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const unreadNotifs = notifications.filter((n) => n.user_id === currentUser.id && !n.read);

  const navLinks = [
    { href: '/discover', label: 'Discover', icon: Search },
    { href: '/bookings', label: 'My Bookings', icon: Layers },
    ...(currentUser.role === 'owner' || currentUser.role === 'admin'
      ? [{ href: '/owner', label: 'Owner Dashboard', icon: LayoutDashboard }]
      : []),
    ...(currentUser.role === 'admin'
      ? [{ href: '/admin', label: 'Admin Console', icon: Shield }]
      : []),
    { href: '/audit', label: 'Audit Log', icon: ShieldAlert },
    { href: '/privacy', label: 'Privacy Note', icon: AlertTriangle },
  ];

  return (
    <>
      {/* Demo Persona Switcher Banner */}
      <div className="bg-slate-900 border-b border-slate-800 text-xs text-slate-300 py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30">
              DEMO PERSONA
            </span>
            <span className="hidden sm:inline text-slate-400">Viewing as:</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="font-medium text-white hover:text-sky-400 flex items-center gap-1.5 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 transition"
              >
                <span>{currentUser.full_name}</span>
                <span className="text-[10px] text-slate-400">
                  ({currentUser.role.toUpperCase()} • {currentUser.department})
                </span>
                <span className="text-[10px] text-sky-400">▼</span>
              </button>

              {roleMenuOpen && (
                <div className="absolute left-0 mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1.5 z-50">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                    Switch Campus Persona
                  </div>
                  {allUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        switchUserById(user.id);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-slate-800 transition ${
                        user.id === currentUser.id ? 'bg-sky-950/40 text-sky-300 font-semibold' : 'text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{user.full_name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                          {user.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {user.department} • Trust: {user.trust_score}/100
                        {user.owner_verified ? ' • Verified Owner' : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              Campus Trust Score:{' '}
              <span className="text-emerald-400 font-semibold">{currentUser.trust_score}/100</span>
            </span>
            <button
              type="button"
              onClick={resetToSeedData}
              title="Reset sample data back to pristine seed state"
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Demo
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Platform Title */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                LabLend
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Campus Trust
                </span>
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>

              {/* Notification dropdown */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      Notifications ({unreadNotifs.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 mt-2">
                    {notifications.filter((n) => n.user_id === currentUser.id).length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-500">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications
                        .filter((n) => n.user_id === currentUser.id)
                        .map((notif) => (
                          <div
                            key={notif.id}
                            className={`py-2 px-1 text-xs transition ${
                              notif.read ? 'opacity-70' : 'bg-sky-50/50 dark:bg-sky-950/20'
                            }`}
                          >
                            <p className="text-slate-800 dark:text-slate-200">{notif.message}</p>
                            <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                              <span>{new Date(notif.created_at).toLocaleDateString()}</span>
                              {!notif.read && (
                                <button
                                  type="button"
                                  onClick={() => markNotificationRead(notif.id)}
                                  className="text-sky-600 dark:text-sky-400 hover:underline"
                                >
                                  Mark as read
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar / Link */}
            <Link
              href="/profile"
              className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-sky-600 transition"
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-semibold text-xs text-slate-800 dark:text-slate-100">
                {currentUser.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
            </Link>
          </div>
        </div>

        {/* Mobile secondary navigation */}
        <div className="md:hidden flex overflow-x-auto gap-1 px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap px-2.5 py-1 rounded ${
                  isActive
                    ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </header>
    </>
  );
}
