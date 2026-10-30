# LabLend — 2-Minute Hackathon Demo Script

> **Target Judges**: Product, Engineering, and Domain Judges  
> **Total Duration**: 120 Seconds  
> **Key Message**: LabLend unlocks high-value campus equipment through an automated trust protocol: eligibility gating, fair-share anti-hoarding waitlists, tamper-evident before/after condition proofs, and human-in-the-loop decisions.

---

### [0:00 - 0:25] The Problem & Landing Page Launchpad
- **Visual**: Open `http://localhost:3000/`. Dark mode enabled, responsive campus aesthetic.
- **Spoken**:
  > *"Every university has millions of dollars of advanced lab equipment, 3D printers, and camera kits sitting idle for 70% of the year. Yet students struggle to get access because lab managers fear broken gear and booking hoarding. LabLend is a production-quality, trust-first campus sharing platform. Right on our home page, judges can click any demo persona to test the platform without passwords."*

---

### [0:25 - 0:50] Discovery & AI Smart Matching
- **Action**: Click **Explore Equipment & Spaces** $\rightarrow$ `/discover`.
- **Action**: Click prompt chip: *"Measure a signal on Saturday"*.
- **Spoken**:
  > *"Students can search by natural language. Our AI Smart Matcher uses Gemini with local fallback to rank matching gear, like the Keysight 4-Channel Oscilloscope. Notice the green and amber badges on each card: the system automatically checks the active student's department and safety certifications before they even apply."*

---

### [0:50 - 1:15] Gated Eligibility & Conflict Detection
- **Action**: Click on **Stratasys F170 Industrial 3D Printer** $\rightarrow$ `/resource/res-3d-printer`.
- **Spoken**:
  > *"On the asset page, our pure domain engine evaluates 8 rules in real time: prerequisites, facility hours, department restrictions, and the 8-hour rolling fair-use cap. Because Aarav already has 7 hours of recent usage, requesting 2 hours correctly flags the fair-use limit! When a time slot is already taken, LabLend automatically detects the conflict, computes the student's Fair-Share priority score, and suggests the 3 nearest free slots with one-click selection."*

---

### [1:15 - 1:40] Transparent "Why this decision?" & Owner Review
- **Action**: Switch persona to **Dr. Anita Mehta (Verified Owner)** $\rightarrow$ `/owner`.
- **Spoken**:
  > *"In the Owner Dashboard, pending requests are sorted by Fair-Share score: recent usage + late penalties. Lower scores get queue priority. Notice the 'Review Suggested' flag for users with past incidents. Owners must provide a mandatory written reason for every approval or rejection—preventing arbitrary gatekeeping. In the student's view, our 'Why this decision?' panel explains the exact score breakdown while keeping peer identities private."*

---

### [1:40 - 2:00] Before/After Condition Proofs & Append-Only Audit
- **Action**: Open Booking `#booking-kabir-past` $\rightarrow$ `/booking/booking-kabir-past`.
- **Visual**: Show side-by-side Before/After inspection photos and the soldering iron damage incident.
- **Action**: Click **Audit Log** $\rightarrow$ `/audit`. Click **Export CSV**.
- **Spoken**:
  > *"During check-in and return, mandatory camera photos and checklists eliminate finger-pointing. When Kabir returned a damaged soldering tip, an incident was logged. Dr. Mehta resolved it with an educational refresher—human in the loop, never an automated penalty. Finally, every single transition is sealed in an append-only PostgreSQL ledger protected by database triggers blocking UPDATE and DELETE. That is LabLend—trust, fairness, and unlocked innovation on campus."*
