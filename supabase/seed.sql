-- SEED DATA FOR LABLEND

-- Fictional UUIDs for deterministic testing & seeding
-- Users
-- Aarav:   11111111-1111-1111-1111-111111111111
-- Riya:    22222222-2222-2222-2222-222222222222
-- Kabir:   33333333-3333-3333-3333-333333333333
-- DrMehta: 44444444-4444-4444-4444-444444444444
-- ProfRao: 55555555-5555-5555-5555-555555555555
-- Admin:   99999999-9999-9999-9999-999999999999

-- Qualifications
-- Qual 3D:      a1111111-0000-0000-0000-000000000001
-- Qual Oscillo: a1111111-0000-0000-0000-000000000002
-- Qual Laser:   a1111111-0000-0000-0000-000000000003

-- Profiles (matching auth.users in production, standalone for mock/seed)
INSERT INTO profiles (id, full_name, email, role, department, id_number, trust_score, late_count, late_cancel_count, damage_count, owner_verified)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Aarav Patel', 'aarav@campus.edu', 'user', 'ECE', 'STU-ECE-2024-01', 88, 0, 0, 0, false),
  ('22222222-2222-2222-2222-222222222222', 'Riya Sharma', 'riya@campus.edu', 'user', 'CSE', 'STU-CSE-2024-02', 80, 0, 0, 0, false),
  ('33333333-3333-3333-3333-333333333333', 'Kabir Sen', 'kabir@campus.edu', 'user', 'ECE', 'STU-ECE-2024-03', 72, 1, 1, 1, false),
  ('44444444-4444-4444-4444-444444444444', 'Dr. Anita Mehta', 'mehta@campus.edu', 'owner', 'Mechanical & Prototyping', 'FAC-MECH-101', 95, 0, 0, 0, true),
  ('55555555-5555-5555-5555-555555555555', 'Prof. Suresh Rao', 'rao@campus.edu', 'owner', 'ECE Lab Systems', 'FAC-ECE-102', 85, 0, 0, 0, false),
  ('99999999-9999-9999-9999-999999999999', 'Elena Vance', 'admin@campus.edu', 'admin', 'Campus Operations', 'ADM-OP-001', 100, 0, 0, 0, true)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Qualifications
INSERT INTO qualifications (id, name, description)
VALUES
  ('a1111111-0000-0000-0000-000000000001', '3D Printer Safe Operation', 'Covers bed leveling, slicer temperature limits, filament loading, and toxic fume ventilation guidelines.'),
  ('a1111111-0000-0000-0000-000000000002', 'High-Frequency Oscilloscope Certification', 'Training in 4-channel grounding isolation, probe calibration, and ESD-safe measurement procedures.'),
  ('a1111111-0000-0000-0000-000000000003', 'Class 4 Laser Cutter Certification', 'Safety protocol for optical shielding, high-pressure air assist, and material toxicity fire prevention.')
ON CONFLICT (id) DO NOTHING;

-- User Qualifications
-- Aarav has 3D printing and oscilloscope verified
INSERT INTO user_qualifications (id, user_id, qualification_id, status, reviewed_by, reviewed_at)
VALUES
  ('b1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a1111111-0000-0000-0000-000000000001', 'verified', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '30 days'),
  ('b1111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'a1111111-0000-0000-0000-000000000002', 'verified', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

-- 8 Resources
INSERT INTO resources (id, owner_id, name, category, description, location, photos, open_hour, close_hour, available_days, max_hours_per_booking, required_qualification_id, department_restriction, supervision_required, deposit_note, usage_rules, status, keywords)
VALUES
  (
    'c1111111-0000-0000-0000-000000000001',
    '44444444-4444-4444-4444-444444444444',
    'Stratasys F170 Industrial 3D Printer',
    'makerspace',
    'High precision FDM printer with dual extrusion and soluble support. Capable of printing PLA, ABS, and TPU with ±0.2mm accuracy.',
    'Makerspace Bay 3, Central Tech Wing',
    ARRAY['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'],
    8, 20, '{1,2,3,4,5,6}', 4,
    'a1111111-0000-0000-0000-000000000001', NULL, false,
    'Bring campus ID. Material spools must be weighed before and after.',
    'Always monitor the initial layer. Do not leave running unattended during high-temp runs.',
    'available',
    ARRAY['3d printer', 'additive', 'rapid prototyping', 'pla', 'abs', 'cad']
  ),
  (
    'c1111111-0000-0000-0000-000000000002',
    '44444444-4444-4444-4444-444444444444',
    'Keysight InfiniiVision 4-Channel 1GHz Oscilloscope',
    'testing devices',
    'Deep memory 4-channel digital storage oscilloscope with arbitrary waveform generator and logic analyzer capability.',
    'ECE Hardware Lab, Room 204B',
    ARRAY['https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'],
    9, 19, '{1,2,3,4,5}', 3,
    'a1111111-0000-0000-0000-000000000002', NULL, false,
    'Calibrated probes must stay with the chassis.',
    'Ground clip must never be connected to mains live voltages. Wear anti-static wrist strap.',
    'available',
    ARRAY['oscilloscope', 'signal', 'electronics', 'frequency', 'hardware', 'keysight']
  ),
  (
    'c1111111-0000-0000-0000-000000000003',
    '44444444-4444-4444-4444-444444444444',
    'Sony Alpha 7 IV Cinema Rig & Prime Lens Kit',
    'cameras',
    'Full frame mirrorless camera kit equipped with 24-70mm f/2.8 GM, wireless lavalier microphones, ND filters, and carbon fiber tripod.',
    'Media Studio, Arts & Media Pavilion, Room 112',
    ARRAY['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80'],
    10, 18, '{1,2,3,4,5}', 4,
    NULL, NULL, false,
    'Equipment checkout requires physical verification of sensor cap and lens glass.',
    'Store lenses in shockproof foam cases. Do not expose equipment to rain or dust.',
    'available',
    ARRAY['camera', 'video', 'sony', 'dslr', 'media', 'podcast', 'cinematography']
  ),
  (
    'c1111111-0000-0000-0000-000000000004',
    '44444444-4444-4444-4444-444444444444',
    'Trotec Speedy 400 CO2 Laser Cutter & Engraver',
    'makerspace',
    '100W CO2 laser cutting bed (1000 x 610mm) for acrylic, plywood, balsa, leather, and anodized aluminum marking.',
    'Prototyping Bay North, Room 108',
    ARRAY['https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80'],
    9, 18, '{1,2,3,4,5}', 2,
    'a1111111-0000-0000-0000-000000000003', NULL, true,
    'Supervised operation only. Lab technician must inspect cut files before laser power-up.',
    'Never cut PVC, vinyl, or carbon fiber due to toxic chlorine gas emission.',
    'available',
    ARRAY['laser cutter', 'engraving', 'acrylic', 'wood', 'cutting', 'fabrication']
  ),
  (
    'c1111111-0000-0000-0000-000000000005',
    '44444444-4444-4444-4444-444444444444',
    'Quantum Innovation Seminar & Defense Room',
    'rooms',
    'Acoustically isolated presentation suite with dual 85" interactive displays, conferencing mics, and seating for 40 researchers.',
    'Innovation Tower, Floor 4, Suite 402',
    ARRAY['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'],
    8, 21, '{1,2,3,4,5,6,7}', 6,
    NULL, NULL, false,
    'Leave whiteboard clean. Report any AV cable disconnects.',
    'Food and open drinks permitted only in the foyer area.',
    'available',
    ARRAY['seminar room', 'meeting room', 'presentation', 'defense', 'conference']
  ),
  (
    'c1111111-0000-0000-0000-000000000006',
    '55555555-5555-5555-5555-555555555555',
    'Embedded Systems & Xilinx FPGA Development Bench',
    'labs',
    'Zynq UltraScale+ FPGA bench station with logic analyzers, JTAG debuggers, and dual 4K monitors for chip verification.',
    'ECE Department Lab, Wing C, Station 04',
    ARRAY['https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=800&q=80'],
    8, 20, '{1,2,3,4,5}', 4,
    NULL, 'ECE', false,
    'Restricted strictly to ECE enrolled students and research staff.',
    'Save synthesis files to network drive. Do not reconfigure JTAG pinouts without supervision.',
    'available',
    ARRAY['fpga', 'embedded', 'xilinx', 'ece', 'verilog', 'microcontroller']
  ),
  (
    'c1111111-0000-0000-0000-000000000007',
    '44444444-4444-4444-4444-444444444444',
    'Meta Quest Pro & HTC Vive XR Research Bundle',
    'testing devices',
    'Dual high-end mixed reality headsets with face/eye tracking, development SDKs, and clean sanitizing UV docking station.',
    'Human-Computer Interaction Lab, Room 315',
    ARRAY['https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80'],
    9, 18, '{1,2,3,4,5}', 3,
    NULL, NULL, false,
    'Ensure lenses are wiped with micro-fiber cloth only. Place on charging dock upon return.',
    'Do not use outside designated 3m x 3m boundary space.',
    'available',
    ARRAY['vr', 'xr', 'meta quest', 'vive', 'mixed reality', 'hci', 'unity']
  ),
  (
    'c1111111-0000-0000-0000-000000000008',
    '44444444-4444-4444-4444-444444444444',
    'Weller WT1010 Precision Soldering Station',
    'makerspace',
    'Micro-soldering station with fume extractor, temperature controlled iron, hot-air rework tool, and microscope for SMD PCB assembly.',
    'Hardware Tinkering Hub, Bench 7',
    ARRAY['https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=800&q=80'],
    8, 20, '{1,2,3,4,5,6}', 3,
    NULL, NULL, false,
    'Clean sponge and brass wool supplied. Turn off main power when stepping away.',
    'Always turn on active fume extractor during flux heating. Clean tip before powering down.',
    'available',
    ARRAY['soldering', 'pcb', 'smd', 'hardware', 'rework', 'tinkering']
  )
ON CONFLICT (id) DO NOTHING;

-- Past Bookings & Incidents for Realistic Dashboard Experience
-- Kabir had a past booking where a soldering iron tip was damaged
INSERT INTO bookings (id, resource_id, user_id, start_at, end_at, purpose, status, decision_reason, decided_by, decided_at)
VALUES
  (
    'd1111111-0000-0000-0000-000000000001',
    'c1111111-0000-0000-0000-000000000008',
    '33333333-3333-3333-3333-333333333333',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days' + INTERVAL '2 hours',
    'SMD soldering for IoT weather station board',
    'returned',
    'Approved for IoT sensor coursework',
    '44444444-4444-4444-4444-444444444444',
    NOW() - INTERVAL '4 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Condition report for Kabir's booking
INSERT INTO condition_reports (id, booking_id, stage, condition, notes, photo_paths, checklist, recorded_by, recorded_at)
VALUES
  (
    'e1111111-0000-0000-0000-000000000001',
    'd1111111-0000-0000-0000-000000000001',
    'before',
    'good',
    'Clean micro tip, temperature profile calibrated, fume hood running.',
    ARRAY['https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=400&q=80'],
    '{"tip_clean": true, "fume_extractor_on": true, "cables_intact": true}',
    '33333333-3333-3333-3333-333333333333',
    NOW() - INTERVAL '3 days'
  ),
  (
    'e1111111-0000-0000-0000-000000000002',
    'd1111111-0000-0000-0000-000000000001',
    'after',
    'damaged',
    'Chisel tip oxidized and bent due to high thermal load and excessive lateral pressure.',
    ARRAY['https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=400&q=80'],
    '{"tip_clean": false, "fume_extractor_on": true, "cables_intact": true}',
    '33333333-3333-3333-3333-333333333333',
    NOW() - INTERVAL '3 days' + INTERVAL '2 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- Incident report
INSERT INTO incidents (id, booking_id, reported_by, type, severity, description, status, resolution, penalty_applied, ai_summary, resolved_by, resolved_at)
VALUES
  (
    'f1111111-0000-0000-0000-000000000001',
    'd1111111-0000-0000-0000-000000000001',
    '33333333-3333-3333-3333-333333333333',
    'damage',
    'minor',
    'During copper pour soldering, the fine chisel tip became oxidized and bent slightly when desoldering a stuck header pin.',
    'resolved',
    'Replacement micro-tip installed from lab consumables stock. Kabir attended 15-min thermal recalibration briefing. No financial penalty applied.',
    false,
    'AI Summary: Incident involves thermal oxidation and minor mechanical deformation of soldering tip during desoldering. User self-reported promptly at return. No structural damage to base station. Owner review recommended replacement from lab stock with refresher briefing.',
    '44444444-4444-4444-4444-444444444444',
    NOW() - INTERVAL '2 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Aarav recent usage: 7 hours past booking in last 7 days for testing fair-use cap
INSERT INTO bookings (id, resource_id, user_id, start_at, end_at, purpose, status, decision_reason, decided_by, decided_at)
VALUES
  (
    'd1111111-0000-0000-0000-000000000002',
    'c1111111-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days' + INTERVAL '7 hours',
    'Robotics chassis structural printing batch',
    'returned',
    'Approved for Capstone project',
    '44444444-4444-4444-4444-444444444444',
    NOW() - INTERVAL '3 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Initial Audit Log Records
INSERT INTO audit_log (actor_id, actor_name, action, entity_type, entity_id, booking_id, detail)
VALUES
  ('99999999-9999-9999-9999-999999999999', 'Elena Vance', 'SYSTEM_INITIALIZATION', 'system', 'lablend-prod', NULL, 'Campus LabLend system booted with campus policies and certified assets.'),
  ('44444444-4444-4444-4444-444444444444', 'Dr. Anita Mehta', 'INCIDENT_RESOLVED', 'incident', 'f1111111-0000-0000-0000-000000000001', 'd1111111-0000-0000-0000-000000000001', 'Resolved soldering tip damage report with educational refresher.')
ON CONFLICT (id) DO NOTHING;
