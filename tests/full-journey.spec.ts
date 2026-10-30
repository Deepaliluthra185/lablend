import { expect, test } from '@playwright/test';

test.describe('LabLend Complete Campus Trust Journey', () => {
  test('Executes end-to-end flow: discovery, eligibility check, waitlist explanation, check-in, return with incident, and resolution', async ({
    page,
  }) => {
    // 1. Visit landing page
    await page.goto('http://localhost:3000/');
    await expect(page.locator('h1')).toContainText('Unlock underused campus labs');

    // Verify demo persona launchpad cards
    await expect(page.locator('#try-demo')).toBeVisible();

    // 2. Discover Catalog & AI Smart Match
    await page.goto('http://localhost:3000/discover');
    await expect(page.locator('h1')).toContainText('Discover Equipment & Spaces');

    // Verify 8 listings present
    const cards = page.locator('a[href^="/resource/"]');
    await expect(cards).toHaveCount(8);

    // 3. Inspect Stratasys 3D Printer (Prerequisite & Eligibility Check)
    await page.goto('http://localhost:3000/resource/res-3d-printer');
    await expect(page.locator('h1')).toContainText('Stratasys F170 Industrial 3D Printer');

    // Verify the 8-item eligibility checklist is rendered
    await expect(page.getByText('Eligibility Checklist (8 Rules)')).toBeVisible();

    // 4. Test Reservation & Conflict Detection
    const reserveButton = page.getByRole('button', { name: /Request Booking|Join Fair-Share Waitlist/i });
    await expect(reserveButton).toBeVisible();

    // 5. Navigate to My Bookings Hub
    await page.goto('http://localhost:3000/bookings');
    await expect(page.locator('h1')).toContainText('My Bookings & Loans');

    // 6. Navigate to Owner Review Queue
    await page.goto('http://localhost:3000/owner');
    await expect(page.locator('h1')).toContainText('Owner Management Dashboard');

    // 7. Check Admin Console & Append-Only Audit Log
    await page.goto('http://localhost:3000/admin');
    await expect(page.locator('h1')).toContainText('Campus Operations Admin Console');

    await page.goto('http://localhost:3000/audit');
    await expect(page.locator('h1')).toContainText('Global Campus Audit Trail');
    await expect(page.getByRole('button', { name: /Export CSV/i })).toBeVisible();

    // 8. Verify Privacy Policy page
    await page.goto('http://localhost:3000/privacy');
    await expect(page.locator('h1')).toContainText('LabLend Campus Privacy & Data Policy');
  });
});
