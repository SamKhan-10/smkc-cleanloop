export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Priority = Severity;

export type Status =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'cleanup_completed'
  | 'awaiting_verification'
  | 'verified_resolved';

export type IssueType =
  | 'gvp'
  | 'littering'
  | 'overflowing_bin'
  | 'illegal_dumping'
  | 'construction_debris'
  | 'waste_burning';

export type StaffRole = 'municipal_officer' | 'ward_officer' | 'field_staff' | 'ground_verifier';

export type ZoneId = 'A' | 'B' | 'C' | 'D';

export interface Ward {
  no: number;
  zone: ZoneId;
  name: string;
  polygon: [number, number][]; // [lat, lng]
  center: [number, number];
}

export interface Zone {
  id: ZoneId;
  name: string;
  area: string;
  depot: { name: string; lat: number; lng: number };
}

export interface Landmark {
  name: string;
  wardNo: number;
  lat: number;
  lng: number;
  sensitivity: number; // 0..1 (schools, hospitals, markets rank higher)
  tag?: string;
}

export interface Evidence {
  image: string; // data URL or "scene:<kind>:<seed>"
  capturedAt: number;
  lat: number;
  lng: number;
  accuracy: number;
  simulated: boolean;
  sceneSeed?: number; // set when captured via the simulated camera feed
}

export interface HistoryEntry {
  status?: Status;
  event: string; // i18n-able event key
  at: number;
  by: string; // actor label (Citizen ID / staff ID / System)
  note?: string;
}

export interface AiAnalysis {
  garbageDetected: boolean;
  imageSeverity: Severity;
  confidence: number; // simulated
  locationSensitivity: number;
  duplicates: string[]; // nearby open complaint IDs
  repeatArea: boolean;
  nearbyHistory: number;
  score: number;
}

export interface Verification {
  verifierId: string;
  at: number;
  lat: number;
  lng: number;
  distanceM: number;
  image: string;
  simulated: boolean;
  notes?: string;
}

export interface Feedback {
  rating: number;
  comment?: string;
  at: number;
}

export interface Complaint {
  id: string;
  num: number;
  citizenId: string;
  type: IssueType;
  wardNo: number;
  zone: ZoneId;
  lat: number;
  lng: number;
  locationName: string;
  description: string;
  citizenSeverity: Severity;
  priority: Priority;
  ai: AiAnalysis;
  status: Status;
  createdAt: number;
  updatedAt: number;
  history: HistoryEntry[];
  crewId?: string;
  verifierId?: string;
  routeId?: string;
  escalated?: boolean;
  evidence: Evidence;
  verification?: Verification;
  feedback?: Feedback;
  demo: boolean;
}

export interface CitizenAccount {
  citizenId: string;
  name: string;
  email: string;
  phone: string;
  createdAt: number;
}

export interface StaffAccount {
  staffId: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  zone: ZoneId;
  department: string;
  documentName: string;
  verification: 'pending' | 'verified';
  createdAt: number;
}

export interface Crew {
  id: string;
  name: string;
  zone: ZoneId;
  members: number;
  vehicle: string;
  lat: number;
  lng: number;
}

export type HotspotStatus = 'detected' | 'investigating' | 'action_assigned' | 'monitoring';

export interface Investigation {
  causes: string[];
  notes: string;
  rootCause?: string;
  correctiveAction?: string;
  assignedOfficer?: string;
  followUpDate?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface EnforcementAction {
  kind: 'notice' | 'review' | 'surveillance';
  at: number;
  by: string;
}

export interface Hotspot {
  id: string;
  wardNo: number;
  zone: ZoneId;
  lat: number;
  lng: number;
  locationName: string;
  complaintIds: string[];
  detectedAt: number;
  status: HotspotStatus;
  investigation: Investigation;
  enforcement: EnforcementAction[];
  actionAt?: number;
}

export type NotificationKind =
  | 'created'
  | 'crew_assigned'
  | 'cleanup_started'
  | 'cleanup_done'
  | 'resolved'
  | 'reopened'
  | 'hotspot'
  | 'new_complaint';

export interface AppNotification {
  id: string;
  audience: 'citizen' | 'staff';
  citizenId?: string;
  complaintId?: string;
  hotspotId?: string;
  kind: NotificationKind;
  at: number;
  read: boolean;
}

export interface OptimizedRoute {
  id: string;
  zone: ZoneId;
  crewId?: string;
  stops: string[]; // complaint IDs in order
  distanceKm: number;
  durationMin: number;
  highPriority: number;
  createdAt: number;
  dispatched: boolean;
}
