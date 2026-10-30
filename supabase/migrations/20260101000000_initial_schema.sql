-- Enable UUID extension and btree_gist for exclusion constraints
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ENUMS AND TYPES
CREATE TYPE user_role AS ENUM ('user', 'owner', 'admin');
CREATE TYPE qualification_status AS ENUM ('pending', 'verified', 'declined');
CREATE TYPE resource_status AS ENUM ('available', 'maintenance', 'retired');
CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected', 'waitlisted', 'checked_in', 'returned', 'cancelled', 'no_show');
CREATE TYPE condition_stage AS ENUM ('before', 'after');
CREATE TYPE item_condition AS ENUM ('good', 'minor_wear', 'damaged');
CREATE TYPE incident_type AS ENUM ('damage', 'delay', 'conflict', 'misuse', 'safety');
CREATE TYPE incident_severity AS ENUM ('minor', 'major');
CREATE TYPE incident_status AS ENUM ('open', 'under_review', 'resolved');

-- 1. PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'user',
  department TEXT NOT NULL,
  id_number TEXT NOT NULL,
  trust_score INT NOT NULL DEFAULT 80,
  late_count INT NOT NULL DEFAULT 0,
  late_cancel_count INT NOT NULL DEFAULT 0,
  damage_count INT NOT NULL DEFAULT 0,
  owner_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. QUALIFICATIONS
CREATE TABLE qualifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. USER QUALIFICATIONS
CREATE TABLE user_qualifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  qualification_id UUID NOT NULL REFERENCES qualifications(id) ON DELETE CASCADE,
  status qualification_status NOT NULL DEFAULT 'pending',
  evidence_path TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, qualification_id)
);

-- 4. RESOURCES
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  photos TEXT[] NOT NULL DEFAULT '{}',
  open_hour INT NOT NULL DEFAULT 8 CHECK (open_hour >= 0 AND open_hour <= 23),
  close_hour INT NOT NULL DEFAULT 20 CHECK (close_hour >= 0 AND close_hour <= 24 AND close_hour > open_hour),
  available_days INT[] NOT NULL DEFAULT '{1,2,3,4,5,6}',
  blackout_dates DATE[] NOT NULL DEFAULT '{}',
  max_hours_per_booking INT NOT NULL DEFAULT 4 CHECK (max_hours_per_booking > 0),
  required_qualification_id UUID REFERENCES qualifications(id) ON DELETE SET NULL,
  department_restriction TEXT,
  supervision_required BOOLEAN NOT NULL DEFAULT FALSE,
  deposit_note TEXT,
  usage_rules TEXT,
  status resource_status NOT NULL DEFAULT 'available',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. BOOKINGS
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  purpose TEXT NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  decision_reason TEXT,
  decided_by UUID REFERENCES profiles(id),
  decided_at TIMESTAMPTZ,
  is_overdue BOOLEAN NOT NULL DEFAULT FALSE,
  extension_requested BOOLEAN NOT NULL DEFAULT FALSE,
  extension_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_booking_time CHECK (end_at > start_at)
);

-- Exclusion constraint (btree_gist) preventing overlapping approved or checked_in bookings on the same resource
ALTER TABLE bookings
ADD CONSTRAINT no_overlapping_approved_bookings
EXCLUDE USING gist (
  resource_id WITH =,
  tstzrange(start_at, end_at) WITH &&
)
WHERE (status IN ('approved', 'checked_in'));

-- 6. CONDITION REPORTS
CREATE TABLE condition_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  stage condition_stage NOT NULL,
  condition item_condition NOT NULL DEFAULT 'good',
  notes TEXT,
  photo_paths TEXT[] NOT NULL DEFAULT '{}',
  checklist JSONB NOT NULL DEFAULT '{}',
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(booking_id, stage)
);

-- 7. INCIDENTS
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES profiles(id),
  type incident_type NOT NULL,
  severity incident_severity NOT NULL DEFAULT 'minor',
  description TEXT NOT NULL,
  status incident_status NOT NULL DEFAULT 'open',
  resolution TEXT,
  penalty_applied BOOLEAN NOT NULL DEFAULT FALSE,
  ai_summary TEXT,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. AUDIT LOG (APPEND-ONLY)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- APPEND-ONLY TRIGGER FOR AUDIT LOG
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit log is strictly append-only. Modification or deletion is forbidden.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_log_append_only
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_modification();

-- AUTOMATIC AUDIT TRIGGER ON BOOKING STATUS CHANGES
CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_name TEXT;
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT COALESCE(full_name, 'System') INTO v_actor_name FROM profiles WHERE id = NEW.decided_by;
    INSERT INTO audit_log (actor_id, actor_name, action, entity_type, entity_id, booking_id, detail)
    VALUES (
      NEW.decided_by,
      COALESCE(v_actor_name, 'System/Owner'),
      'STATUS_CHANGE_' || UPPER(NEW.status::TEXT),
      'booking',
      NEW.id::TEXT,
      NEW.id,
      'Booking transitioned from ' || OLD.status::TEXT || ' to ' || NEW.status::TEXT || '. Reason: ' || COALESCE(NEW.decision_reason, 'None provided')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_booking_status
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION log_booking_status_change();

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_resources_owner ON resources(owner_id);
CREATE INDEX idx_resources_category ON resources(category);
CREATE INDEX idx_resources_status ON resources(status);
CREATE INDEX idx_bookings_resource ON bookings(resource_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_range ON bookings(start_at, end_at);
CREATE INDEX idx_user_qualifications_user ON user_qualifications(user_id);
CREATE INDEX idx_incidents_booking ON incidents(booking_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE condition_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles: Users see all public profiles, can update their own
CREATE POLICY "Profiles readable by authenticated users" ON profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL TO authenticated USING (auth_user_role() = 'admin');

-- Qualifications: Visible to all, editable by admin
CREATE POLICY "Qualifications visible to all" ON qualifications
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Qualifications manageable by admin" ON qualifications
  FOR ALL TO authenticated USING (auth_user_role() = 'admin');

-- User Qualifications: Users view own, admins view and review all
CREATE POLICY "Users view own qualifications" ON user_qualifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth_user_role() = 'admin');
CREATE POLICY "Users insert own qualification requests" ON user_qualifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage qualifications" ON user_qualifications
  FOR ALL TO authenticated USING (auth_user_role() = 'admin');

-- Resources: All active visible to authenticated users, owners manage own, admins manage all
CREATE POLICY "Resources visible to all authenticated" ON resources
  FOR SELECT TO authenticated USING (status != 'retired' OR owner_id = auth.uid() OR auth_user_role() = 'admin');
CREATE POLICY "Owners manage own resources" ON resources
  FOR ALL TO authenticated USING (owner_id = auth.uid() OR auth_user_role() = 'admin');

-- Bookings: User sees own, Owner sees for own resources, Admin sees all
CREATE POLICY "Users view own bookings" ON bookings
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM resources WHERE resources.id = bookings.resource_id AND resources.owner_id = auth.uid())
    OR auth_user_role() = 'admin'
  );
CREATE POLICY "Users insert own booking requests" ON bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Booking update permissions" ON bookings
  FOR UPDATE TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM resources WHERE resources.id = bookings.resource_id AND resources.owner_id = auth.uid())
    OR auth_user_role() = 'admin'
  );

-- Condition Reports: Booking user, resource owner, and admin
CREATE POLICY "Condition reports visibility" ON condition_reports
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN resources r ON r.id = b.resource_id
      WHERE b.id = condition_reports.booking_id
      AND (b.user_id = auth.uid() OR r.owner_id = auth.uid() OR auth_user_role() = 'admin')
    )
  );
CREATE POLICY "Condition reports creation" ON condition_reports
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = condition_reports.booking_id AND b.user_id = auth.uid()
    ) OR auth_user_role() = 'admin'
  );

-- Incidents: Visible to booking user, owner, admin
CREATE POLICY "Incidents visibility" ON incidents
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN resources r ON r.id = b.resource_id
      WHERE b.id = incidents.booking_id
      AND (b.user_id = auth.uid() OR r.owner_id = auth.uid() OR auth_user_role() = 'admin')
    )
  );
CREATE POLICY "Incidents reporting" ON incidents
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = reported_by OR auth_user_role() = 'admin'
  );
CREATE POLICY "Incidents resolution by owner or admin" ON incidents
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN resources r ON r.id = b.resource_id
      WHERE b.id = incidents.booking_id AND (r.owner_id = auth.uid() OR auth_user_role() = 'admin')
    )
  );

-- Notifications: Strictly user's own
CREATE POLICY "Notifications strictly own" ON notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Notifications update own" ON notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Audit Log: Visible to Admins and resource Owners for their own assets, INSERT allowed
CREATE POLICY "Audit log viewable by admin and owner" ON audit_log
  FOR SELECT TO authenticated USING (
    auth_user_role() = 'admin'
    OR actor_id = auth.uid()
    OR (booking_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM bookings b
      JOIN resources r ON r.id = b.resource_id
      WHERE b.id = audit_log.booking_id AND (b.user_id = auth.uid() OR r.owner_id = auth.uid())
    ))
  );
CREATE POLICY "Audit log append only" ON audit_log
  FOR INSERT TO authenticated WITH CHECK (true);
