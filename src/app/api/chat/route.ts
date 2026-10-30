import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, userContext } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const cleanMsg = message.toLowerCase().trim();
    const geminiKey = process.env.GEMINI_API_KEY;

    // Platform rules context for grounding
    const systemRules = `You are LabLend's friendly, campus-grounded helper chatbot.
Current signed-in user: ${userContext?.name || 'Campus Member'} (${userContext?.role || 'user'}, Dept: ${userContext?.department || 'General'}, Trust: ${userContext?.trustScore || 80}/100).
Recent usage: ${userContext?.recentUsage || 0} hours out of 8h rolling weekly cap.

CRITICAL RULES:
1. You may NEVER approve, reject, or penalize bookings or users. If asked to make a decision, explicitly state that human facility owners or campus operations admins decide.
2. The weekly fair-use cap is 8 hours in a rolling 7-day window.
3. Fair-share waitlist score = Hours Used (7d) + 2 × Late Returns + 1 × Late Cancellations (<24h). Lower score gets queue priority.
4. Check-in and return require mandatory condition reports and photo verification.
5. Inquiries about penalties: Penalties are never automatic. A human owner or admin must review and confirm any penalty.
Keep answers concise, helpful, and polite.`;

    // 1. Try Gemini if configured
    if (geminiKey && geminiKey.trim() !== '') {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

        const response = await model.generateContent(`${systemRules}\n\nUser Question: ${message}`);
        const reply = response.response.text().trim();
        return NextResponse.json({
          reply,
          source: 'gemini',
        });
      } catch (geminiError) {
        console.warn('Gemini chat fallback triggered:', geminiError);
      }
    }

    // 2. Local rule-based grounded chatbot fallback
    let reply =
      'I am here to guide you through LabLend campus policies. Could you clarify your question regarding bookings, equipment eligibility, or returns?';

    if (cleanMsg.includes('cap') || cleanMsg.includes('8 hour') || cleanMsg.includes('weekly') || cleanMsg.includes('limit')) {
      reply = `LabLend enforces Campus Rule #2: Each member is allowed up to 8 hours of equipment usage in a rolling 7-day window. You currently have used ${userContext?.recentUsage || 0}h. Once your completed sessions age past 7 days, your available quota automatically replenishes!`;
    } else if (cleanMsg.includes('waitlist') || cleanMsg.includes('priority') || cleanMsg.includes('queue') || cleanMsg.includes('why am i')) {
      reply =
        'If a requested time slot overlaps with an existing reservation, you are automatically placed in the Fair-Share Waitlist. Queue priority is determined by your score: (7d Usage) + 2×(Late Returns) + 1×(Late Cancels). Lower score gets priority! If the prior user cancels, you are auto-promoted to pending.';
    } else if (cleanMsg.includes('check-in') || cleanMsg.includes('check in') || cleanMsg.includes('return') || cleanMsg.includes('photo')) {
      reply =
        'When your reservation starts, open "My Bookings" and launch the Check-In Wizard. You will inspect the equipment, upload a verification photo, and confirm the checklist. At session end, repeat the return inspection to complete handback and maintain your trust score.';
    } else if (cleanMsg.includes('damage') || cleanMsg.includes('broken') || cleanMsg.includes('incident') || cleanMsg.includes('penalty')) {
      reply =
        'If equipment is damaged or delayed, report it immediately in the Return Wizard. LabLend requires human oversight: AI never applies penalties or bans automatically. A human facility manager will review the report, inspect photos, and decide if educational refresher or replacement is appropriate.';
    } else if (cleanMsg.includes('approve') || cleanMsg.includes('can you approve') || cleanMsg.includes('cancel')) {
      reply =
        'As an AI assistant, I cannot approve, reject, or cancel reservations directly. All decisions are reserved strictly for human facility owners (like Dr. Mehta) and Campus Operations admins.';
    } else if (cleanMsg.includes('qualification') || cleanMsg.includes('cert') || cleanMsg.includes('training')) {
      reply =
        'Specialized equipment like 3D printers and laser cutters requires prerequisite safety certification. You can upload your training certificate directly from the equipment detail page or your Profile page for admin verification.';
    }

    return NextResponse.json({
      reply,
      source: 'grounded-rule-engine',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error in chat handler';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
