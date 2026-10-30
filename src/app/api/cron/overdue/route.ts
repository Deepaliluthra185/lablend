import { INITIAL_BOOKINGS, INITIAL_RESOURCES } from '@/lib/store/demo-data';
import { Booking } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // In a live environment, this queries the PostgreSQL `bookings` table.
    // For demo / local execution, we provide the automated logic & audit output.
    const overdueBookings: Array<{ id: string; user_id: string; resource_id: string; minutesLate: number }> = [];
    const dueSoonBookings: Array<{ id: string; user_id: string; resource_id: string; minutesRemaining: number }> = [];

    // Scan sample bookings
    INITIAL_BOOKINGS.forEach((b: Booking) => {
      if (b.status === 'checked_in') {
        const end = new Date(b.end_at);
        if (now.getTime() > end.getTime()) {
          overdueBookings.push({
            id: b.id,
            user_id: b.user_id,
            resource_id: b.resource_id,
            minutesLate: Math.round((now.getTime() - end.getTime()) / 60000),
          });
        } else if (end.getTime() <= oneHourFromNow.getTime()) {
          dueSoonBookings.push({
            id: b.id,
            user_id: b.user_id,
            resource_id: b.resource_id,
            minutesRemaining: Math.round((end.getTime() - now.getTime()) / 60000),
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      overdueScanned: overdueBookings.length,
      dueSoonScanned: dueSoonBookings.length,
      overdueBookings,
      dueSoonBookings,
      message: `Cron executed. Checked-in loans evaluated for return deadlines.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error in overdue cron';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
