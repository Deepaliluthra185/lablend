'use client';

import { getRolling7DayUsageHours } from '@/lib/domain';
import { useLabLend } from '@/lib/store';
import {
  Bot,
  HelpCircle,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  source?: string;
}

const SUGGESTED_QUESTIONS = [
  'How does the weekly fair-use cap work?',
  'Why am I in the waitlist?',
  'How do I check in and return equipment?',
  'What happens if equipment gets damaged?',
  'Can you approve my reservation?',
];

export function ChatbotWidget() {
  const { currentUser, bookings } = useLabLend();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const userBookings = useMemo(() => {
    return bookings.filter((b) => b.user_id === currentUser.id);
  }, [bookings, currentUser.id]);

  const recentUsage = useMemo(() => {
    if (!mounted) return 0;
    return Math.round(getRolling7DayUsageHours(userBookings, new Date()) * 10) / 10;
  }, [userBookings, mounted]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  React.useEffect(() => {
    if (mounted) {
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: `Hello ${currentUser.full_name}! I am the LabLend campus assistant. I can explain fair-use rules, waitlist priority, and check-in workflows. (Note: Only human owners can approve bookings). What can I help you with?`,
        },
      ]);
    }
  }, [mounted, currentUser.full_name]);

  if (!mounted) return null;

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          userContext: {
            name: currentUser.full_name,
            role: currentUser.role,
            department: currentUser.department,
            trustScore: currentUser.trust_score,
            recentUsage,
          },
        }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'I am having trouble retrieving that policy rule. Please check with campus operations.',
        source: data.source,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'assistant',
          text: 'LabLend assistant is currently operating offline. Campus Rule: Fair-use cap is 8 hours in rolling 7-days. Lower fair-share score gets waitlist priority.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-slate-900 dark:bg-sky-500 hover:bg-slate-800 dark:hover:bg-sky-400 text-white dark:text-slate-950 font-bold text-xs shadow-2xl hover:scale-105 transition duration-200 border border-slate-700 dark:border-sky-300"
          >
            <Sparkles className="w-4 h-4 text-sky-400 dark:text-slate-950" />
            <span>LabLend Assistant</span>
          </button>
        )}
      </div>

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[520px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in text-xs">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">LabLend Policy Guide</h3>
                <p className="text-[10px] text-sky-300">Grounded AI • Human Owners Decide</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Box */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                    AI
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.source && (
                    <span className="block text-[9px] text-slate-400 mt-1">
                      via {msg.source}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                  AI
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400">
                  Checking campus rules...
                </div>
              </div>
            )}
          </div>

          {/* Quick chips */}
          <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5 overflow-x-auto text-[10px]">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 transition"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputVal);
            }}
            className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask about fair-use, waitlists, penalties..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || loading}
              className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-40 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
