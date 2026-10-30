# LabLend | Campus Equipment & Space Governance Protocol

> A production-quality, trust-first platform for sharing underused university spaces and equipment (makerspaces, electronics labs, cinema cameras, testing devices, seminar rooms).

---

## 🌟 Key Features

1. **8-Rule Eligibility Engine**:
   - Resource operational status check
   - Future timing constraint
   - Max session duration enforcement
   - Enrolled academic department match
   - Prerequisite safety qualification verification
   - Operating hours & available day schedule
   - Campus maintenance/holiday blackout calendar
   - Rolling 7-day 8-hour weekly fair-use cap
2. **Fair-Share Waitlist Algorithm**:
   - `Fair-Share Score = Hours Used (7d) + 2 × Late Returns + 1 × Late Cancellations (<24h)`
   - Lower score receives priority in waitlists.
   - If an approved session cancels, the top waitlisted student is auto-promoted to pending and the owner is notified.
3. **Transparent "Why this decision?" Panel**:
   - Plain-language explanation showing the student's numerical score breakdown, queue rank, and rule applied.
   - Peer identities remain strictly concealed under campus privacy guidelines.
4. **Before & After Condition Proofing**:
   - Side-by-side inspection photo comparison and verified checklists during check-in and handback.
5. **Human-in-the-Loop Governance**:
   - AI assists by parsing natural language requests and summarizing incidents.
   - AI **never** approves, rejects, or applies financial penalties autonomously.
6. **Append-Only Immutable Audit Trail**:
   - Database trigger blocks `UPDATE` and `DELETE` on the PostgreSQL audit table.
   - 1-click CSV export for campus compliance audits.

---

## 🚀 Quick Start (Running Locally)

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd lablend
npm install --legacy-peer-deps
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```
*(Note: LabLend is equipped with an integrated zero-setup local demo store with pre-seeded campus personas and offline AI fallbacks, so you can test all features immediately without external dependencies.)*

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Run Unit Tests (Vitest)
```bash
npm test
```
Executes all 12 pure-domain business logic tests covering eligibility, weekly caps, conflict detection, fair-share scores, and extensions.

---

## 👥 Demo Campus Personas (One-Click Launchpad)

Test each perspective directly using the top bar switcher or home page cards:

| Persona | Role | Department | Key Attributes & Test Scenarios |
| :--- | :--- | :--- | :--- |
| **Aarav Patel** | Student | ECE | Verified in 3D Printing & Oscilloscope. Has **7.0h recent usage** in last 7 days (ready to test 8h weekly cap). |
| **Riya Sharma** | Student | CSE | No safety training qualifications yet. Demonstrates eligibility checklist rejection & certificate upload. |
| **Kabir Sen** | Student | ECE | Has 1 late return, 1 late cancel, and 1 resolved minor damage incident on record. Triggers owner "Review suggested" badge. |
| **Dr. Anita Mehta** | Verified Owner | Mech / Makerspace | Facility manager for Makerspace. Manages 3D printer, laser cutter, oscilloscope, seminar room, and review queue. |
| **Prof. Suresh Rao** | Unverified Owner | ECE Lab Systems | Unverified faculty owner. Demonstrates admin verification workflow in Admin Console. |
| **Elena Vance** | Admin | Campus Operations | Campus administrator. Access to global audit log with CSV export, owner verification, and qualification review. |

---

## 🏛️ Campus Inventory (8 Seeded Resources)

1. **Stratasys F170 Industrial 3D Printer** (Makerspace, requires 3D printer certification, max 4h)
2. **Keysight InfiniiVision 4-Channel Oscilloscope** (Testing Devices, requires high-frequency certification, max 3h)
3. **Sony Alpha 7 IV Cinema Rig & Prime Lens Kit** (Cameras & Media Studio, open to all, max 4h)
4. **Trotec Speedy 400 CO2 Laser Cutter** (Makerspace, technician supervision required, max 2h)
5. **Quantum Innovation Seminar & Defense Room** (Academic Hub, capacity 40, max 6h)
6. **Embedded Systems & Xilinx FPGA Bench** (ECE Lab, department restricted strictly to ECE)
7. **Meta Quest Pro & HTC Vive XR Research Bundle** (Testing Devices, optical lens deposit notice)
8. **Weller WT1010 Precision Soldering Station** (Makerspace, past resolved minor damage record)

---

## 📜 Database Migrations & Triggers

To initialize a live Supabase instance:
1. Open the Supabase SQL Editor.
2. Run `supabase/migrations/20260101000000_initial_schema.sql` (Creates 9 tables, types, exclusion constraint, and append-only trigger).
3. Run `supabase/seed.sql` (Inserts deterministic campus demo dataset).

---

## 🏆 Hackathon Submission Documents
- Complete Architecture & Governance Analysis: [docs/PROJECT.md](file:///c:/Users/HP/OneDrive/Desktop/lablend/docs/PROJECT.md)
- 2-Minute Presentation Demo Script: [docs/DEMO_SCRIPT.md](file:///c:/Users/HP/OneDrive/Desktop/lablend/docs/DEMO_SCRIPT.md)
