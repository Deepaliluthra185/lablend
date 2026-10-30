export type UserRole = 'user' | 'owner' | 'admin';
export type QualificationStatus = 'pending' | 'verified' | 'declined';
export type ResourceStatus = 'available' | 'maintenance' | 'retired';
export type BookingStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'waitlisted'
  | 'checked_in'
  | 'returned'
  | 'cancelled'
  | 'no_show';
export type ConditionStage = 'before' | 'after';
export type ItemCondition = 'good' | 'minor_wear' | 'damaged';
export type IncidentType = 'damage' | 'delay' | 'conflict' | 'misuse' | 'safety';
export type IncidentSeverity = 'minor' | 'major';
export type IncidentStatus = 'open' | 'under_review' | 'resolved';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department: string;
  id_number: string;
  trust_score: number;
  late_count: number;
  late_cancel_count: number;
  damage_count: number;
  owner_verified: boolean;
  created_at: string;
}

export interface Qualification {
  id: string;
  name: string;
  description: string;
  created_at?: string;
}

export interface UserQualification {
  id: string;
  user_id: string;
  qualification_id: string;
  status: QualificationStatus;
  evidence_path?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  qualification?: Qualification;
}

export interface Resource {
  id: string;
  owner_id: string;
  name: string;
  category: 'makerspace' | 'labs' | 'cameras' | 'testing devices' | 'rooms' | string;
  description: string;
  location: string;
  photos: string[];
  open_hour: number; // e.g. 8 for 08:00
  close_hour: number; // e.g. 20 for 20:00
  available_days: number[]; // 1=Mon, 2=Tue... 7=Sun
  blackout_dates: string[]; // YYYY-MM-DD
  max_hours_per_booking: number;
  required_qualification_id?: string | null;
  required_qualification?: Qualification | null;
  department_restriction?: string | null;
  supervision_required: boolean;
  deposit_note?: string | null;
  usage_rules?: string | null;
  status: ResourceStatus;
  keywords: string[];
  created_at?: string;
  owner?: Profile;
}

export interface Booking {
  id: string;
  resource_id: string;
  user_id: string;
  start_at: string; // ISO
  end_at: string; // ISO
  purpose: string;
  status: BookingStatus;
  decision_reason?: string | null;
  decided_by?: string | null;
  decided_at?: string | null;
  is_overdue: boolean;
  extension_requested: boolean;
  extension_status?: 'pending' | 'approved' | 'rejected' | null;
  created_at: string;
  resource?: Resource;
  user?: Profile;
  fair_share_score?: number;
  waitlist_position?: number;
}

export interface ConditionReport {
  id: string;
  booking_id: string;
  stage: ConditionStage;
  condition: ItemCondition;
  notes?: string;
  photo_paths: string[];
  checklist: Record<string, boolean>;
  recorded_by: string;
  recorded_at: string;
}

export interface Incident {
  id: string;
  booking_id: string;
  reported_by: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  status: IncidentStatus;
  resolution?: string | null;
  penalty_applied: boolean;
  ai_summary?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at: string;
  reporter?: Profile;
  booking?: Booking;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id?: string | null;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  booking_id?: string | null;
  detail?: string | null;
  created_at: string;
}

export interface EligibilityResult {
  ok: boolean;
  label: string;
  reason: string;
}
