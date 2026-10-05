import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AppNotification, CitizenAccount, Complaint, EnforcementAction, Evidence, Hotspot, IssueType, NotificationKind,
  OptimizedRoute, Severity, StaffAccount, StaffRole, Status, Verification, AiAnalysis, Priority,
} from './types';
import { CREWS, DEMO_CITIZEN, generateSeed } from './seed';
import { describeLocation } from './geo';
import { applyHotspotRule } from './hotspots';
import { scoreToPriority } from './ai';

export type Lang = 'en' | 'mr' | 'hi';

interface State {
  complaints: Complaint[];
  hotspots: Hotspot[];
  notifications: AppNotification[];
  citizens: CitizenAccount[];
  staff: StaffAccount[];
  routes: OptimizedRoute[];
  nextNum: number;
  nextNotif: number;
  session: { citizenId?: string; staffId?: string; verifierId?: string };
  lang: Lang;
}

export interface NewComplaintInput {
  citizenId: string;
  type: IssueType;
  description: string;
  citizenSeverity: Severity;
  evidence: Evidence;
  ai: AiAnalysis;
}

interface Actions {
  setLang: (l: Lang) => void;
  registerCitizen: (d: { name: string; email: string; phone: string }) => CitizenAccount;
  loginCitizen: (id: string) => void;
  logoutCitizen: () => void;
  registerStaff: (d: Omit<StaffAccount, 'staffId' | 'createdAt' | 'verification'>) => StaffAccount;
  verifyStaff: (staffId: string) => void;
  loginStaff: (s: StaffAccount) => void;
  logoutStaff: () => void;
  logoutVerifier: () => void;
  createComplaint: (d: NewComplaintInput) => { complaint: Complaint; hotspotEvent: { type: 'joined' | 'detected'; hotspot: Hotspot } | null };
  assignCrew: (id: string, crewId: string, by: string) => void;
  startCleanup: (id: string, by: string) => void;
  completeCleanup: (id: string, by: string) => void;
  verifyComplaint: (id: string, v: Verification) => void;
  reopenComplaint: (id: string, by: string, note: string) => void;
  escalate: (id: string, by: string) => void;
  submitFeedback: (id: string, rating: number, comment?: string) => void;
  saveRoute: (r: OptimizedRoute) => void;
  dispatchRoute: (routeId: string, crewId: string, by: string) => void;
  updateHotspot: (id: string, patch: Partial<Hotspot>) => void;
  addEnforcement: (id: string, kind: EnforcementAction['kind'], by: string) => void;
  markNotificationsRead: (audience: 'citizen' | 'staff', citizenId?: string) => void;
  resetDemo: () => void;
}

const PRIORITY_UP: Record<Priority, Priority> = { low: 'medium', medium: 'high', high: 'critical', critical: 'critical' };

function freshState(): Omit<State, 'lang' | 'session'> {
  const seed = generateSeed();
  return {
    complaints: seed.complaints,
    hotspots: seed.hotspots,
    notifications: seed.notifications,
    citizens: [{ ...DEMO_CITIZEN, createdAt: Date.now() - 40 * 86400000 }],
    staff: [],
    routes: [],
    nextNum: 1284,
    nextNotif: seed.nextNotificationId,
  };
}

// localStorage wrapper: never throw (private mode, quota exceeded) — the app keeps working in memory.
let warned = false;
const safeStorage = {
  getItem: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch (e) {
      if (!warned) {
        warned = true;
        console.warn('CivicSense: browser storage is full or unavailable; recent changes are kept for this session only.', e);
      }
    }
  },
  removeItem: (k: string) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

const rid = (prefix: string) => `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => {
      const notify = (n: { audience: 'citizen' | 'staff'; kind: NotificationKind; complaintId?: string; hotspotId?: string; citizenId?: string }) =>
        set((s) => ({
          notifications: [{ id: `N-${s.nextNotif}`, at: Date.now(), read: false, ...n }, ...s.notifications],
          nextNotif: s.nextNotif + 1,
        }));

      const patch = (id: string, fn: (c: Complaint) => Complaint) =>
        set((s) => ({ complaints: s.complaints.map((c) => (c.id === id ? fn(c) : c)) }));

      const transition = (c: Complaint, status: Status | undefined, event: string, by: string, note?: string): Complaint => {
        const at = Date.now();
        return {
          ...c,
          status: status ?? c.status,
          updatedAt: at,
          history: [...c.history, { event, at, by, status, note }],
        };
      };

      return {
        ...freshState(),
        session: {},
        lang: 'en',

        setLang: (lang) => set({ lang }),

        registerCitizen: (d) => {
          const email = d.email.trim().toLowerCase();
          const existing = get().citizens.find((c) => c.email.toLowerCase() === email);
          if (existing) return existing;
          const taken = new Set([...get().citizens.map((c) => c.citizenId), ...get().complaints.map((c) => c.citizenId)]);
          let id = '';
          do id = `C-${10000 + Math.floor(Math.random() * 89999)}`;
          while (taken.has(id));
          const acc: CitizenAccount = { citizenId: id, name: d.name.trim(), email, phone: d.phone.trim(), createdAt: Date.now() };
          set((s) => ({ citizens: [...s.citizens, acc] }));
          return acc;
        },
        loginCitizen: (citizenId) => set((s) => ({ session: { ...s.session, citizenId } })),
        logoutCitizen: () => set((s) => ({ session: { ...s.session, citizenId: undefined } })),

        registerStaff: (d) => {
          const email = d.email.trim().toLowerCase();
          const existing = get().staff.find((x) => x.email === email && x.role === d.role);
          if (existing) {
            const upd = { ...existing, ...d, email };
            set((s) => ({ staff: s.staff.map((x) => (x.staffId === existing.staffId ? upd : x)) }));
            return upd;
          }
          const prefix: Record<StaffRole, string> = { municipal_officer: 'MO', ward_officer: 'WO', field_staff: 'FS', ground_verifier: 'GV' };
          const acc: StaffAccount = { ...d, email, staffId: rid(prefix[d.role]), createdAt: Date.now(), verification: 'pending' };
          set((s) => ({ staff: [...s.staff, acc] }));
          return acc;
        },
        verifyStaff: (staffId) =>
          set((s) => ({ staff: s.staff.map((x) => (x.staffId === staffId ? { ...x, verification: 'verified' } : x)) })),
        loginStaff: (acc) =>
          set((s) => ({
            session: acc.role === 'ground_verifier' ? { ...s.session, verifierId: acc.staffId } : { ...s.session, staffId: acc.staffId },
          })),
        logoutStaff: () => set((s) => ({ session: { ...s.session, staffId: undefined } })),
        logoutVerifier: () => set((s) => ({ session: { ...s.session, verifierId: undefined } })),

        createComplaint: (d) => {
          const s = get();
          const num = s.nextNum;
          const now = Date.now();
          const { ward, locationName } = describeLocation(d.evidence.lat, d.evidence.lng);
          const priority = scoreToPriority(d.ai.score);
          const c: Complaint = {
            id: `GVP-${num}`,
            num,
            citizenId: d.citizenId,
            type: d.type,
            wardNo: ward.no,
            zone: ward.zone,
            lat: d.evidence.lat,
            lng: d.evidence.lng,
            locationName,
            description: d.description.trim(),
            citizenSeverity: d.citizenSeverity,
            priority,
            ai: d.ai,
            status: 'assigned',
            createdAt: now,
            updatedAt: now,
            evidence: d.evidence,
            demo: false,
            history: [
              { event: 'submitted', at: now, by: d.citizenId, status: 'pending' },
              { event: 'location_verified', at: now, by: 'CivicSense System' },
              { event: 'ward_identified', at: now, by: 'CivicSense System' },
              { event: 'ai_validated', at: now, by: 'CivicSense System', note: d.ai.duplicates.length ? d.ai.duplicates.join(', ') : undefined },
              { event: 'routed', at: now, by: 'CivicSense System', status: 'assigned', note: `Zone ${ward.zone} Office` },
            ],
          };
          const complaints = [c, ...s.complaints];
          const { hotspots, event } = applyHotspotRule(c, complaints, s.hotspots, now);
          set({ complaints, hotspots, nextNum: num + 1 });
          notify({ audience: 'citizen', citizenId: d.citizenId, complaintId: c.id, kind: 'created' });
          notify({ audience: 'staff', complaintId: c.id, kind: 'new_complaint' });
          if (event) notify({ audience: 'staff', hotspotId: event.hotspot.id, kind: 'hotspot' });
          return { complaint: c, hotspotEvent: event };
        },

        assignCrew: (id, crewId, by) => {
          const c = get().complaints.find((x) => x.id === id);
          if (!c) return;
          patch(id, (x) => ({ ...transition(x, x.status === 'pending' ? 'assigned' : undefined, 'crew_assigned', by, crewId), crewId }));
          notify({ audience: 'citizen', citizenId: c.citizenId, complaintId: id, kind: 'crew_assigned' });
        },

        startCleanup: (id, by) => {
          const c = get().complaints.find((x) => x.id === id);
          if (!c) return;
          let next = c;
          if (!c.crewId) {
            const crew = CREWS.find((k) => k.zone === c.zone)!;
            next = { ...transition(next, 'assigned', 'crew_assigned', by, crew.id), crewId: crew.id };
          }
          next = transition(next, 'in_progress', 'cleanup_started', next.crewId!);
          patch(id, () => next);
          notify({ audience: 'citizen', citizenId: c.citizenId, complaintId: id, kind: 'cleanup_started' });
        },

        completeCleanup: (id, by) => {
          const c = get().complaints.find((x) => x.id === id);
          if (!c) return;
          patch(id, (x) => {
            const done = transition(x, 'cleanup_completed', 'cleanup_completed', x.crewId ?? by);
            return transition(done, 'awaiting_verification', 'verification_queued', 'CivicSense System', `Ground Verification · Zone ${x.zone}`);
          });
          notify({ audience: 'citizen', citizenId: c.citizenId, complaintId: id, kind: 'cleanup_done' });
        },

        verifyComplaint: (id, v) => {
          const c = get().complaints.find((x) => x.id === id);
          if (!c) return;
          patch(id, (x) => ({ ...transition(x, 'verified_resolved', 'verified', v.verifierId), verification: v, verifierId: v.verifierId }));
          notify({ audience: 'citizen', citizenId: c.citizenId, complaintId: id, kind: 'resolved' });
        },

        reopenComplaint: (id, by, note) => {
          const c = get().complaints.find((x) => x.id === id);
          if (!c) return;
          patch(id, (x) => transition(x, 'in_progress', 'reopened', by, note));
          notify({ audience: 'citizen', citizenId: c.citizenId, complaintId: id, kind: 'reopened' });
        },

        escalate: (id, by) =>
          patch(id, (x) => ({ ...transition(x, undefined, 'escalated', by), escalated: true, priority: PRIORITY_UP[x.priority] })),

        submitFeedback: (id, rating, comment) =>
          patch(id, (x) => ({
            ...x,
            feedback: { rating, comment, at: Date.now() },
            history: [...x.history, { event: 'feedback', at: Date.now(), by: x.citizenId, note: `${rating}/5` }],
          })),

        saveRoute: (r) => set((s) => ({ routes: [r, ...s.routes.filter((x) => x.id !== r.id)] })),

        dispatchRoute: (routeId, crewId, by) => {
          const route = get().routes.find((r) => r.id === routeId);
          if (!route) return;
          set((s) => ({
            routes: s.routes.map((r) => (r.id === routeId ? { ...r, crewId, dispatched: true } : r)),
            complaints: s.complaints.map((c) =>
              route.stops.includes(c.id)
                ? {
                    ...transition(c, c.status === 'pending' ? 'assigned' : undefined, 'route_added', by, `${routeId} · ${crewId}`),
                    crewId,
                    routeId,
                  }
                : c,
            ),
          }));
          route.stops.forEach((cid) => {
            const c = get().complaints.find((x) => x.id === cid);
            if (c) notify({ audience: 'citizen', citizenId: c.citizenId, complaintId: cid, kind: 'crew_assigned' });
          });
        },

        updateHotspot: (id, p) => set((s) => ({ hotspots: s.hotspots.map((h) => (h.id === id ? { ...h, ...p } : h)) })),
        addEnforcement: (id, kind, by) =>
          set((s) => ({
            hotspots: s.hotspots.map((h) => (h.id === id ? { ...h, enforcement: [...h.enforcement, { kind, by, at: Date.now() }] } : h)),
          })),

        markNotificationsRead: (audience, citizenId) =>
          set((s) => ({
            notifications: s.notifications.map((n) =>
              n.audience === audience && (audience === 'staff' || n.citizenId === citizenId) ? { ...n, read: true } : n,
            ),
          })),

        resetDemo: () => set({ ...freshState(), session: {} }),
      };
    },
    {
      name: 'smkc-cleanloop', // internal storage key kept so existing demo data is preserved
      version: 3,
      storage: createJSONStorage(() => safeStorage),
      // v2: product renamed to CivicSense — update stored user-visible strings (audit actor, demo email).
      // v3: ward offices are labelled "Zone A–D" (wards are always numbered) — update stored notes.
      migrate: (persisted, version) => {
        if (!persisted) return persisted as State & Actions;
        let json = JSON.stringify(persisted);
        if (version < 2) {
          json = json.split('CleanLoop System').join('CivicSense System').split('citizen.demo@cleanloop.in').join('citizen.demo@civicsense.in');
        }
        if (version < 3) {
          json = json.replace(/Ward Office ([A-D])/g, 'Zone $1 Office').replace(/Ground Verification · Ward ([A-D])/g, 'Ground Verification · Zone $1');
        }
        return JSON.parse(json) as State & Actions;
      },
    },
  ),
);

// Selectors / helpers
export const useCitizen = () => {
  const id = useStore((s) => s.session.citizenId);
  return useStore((s) => s.citizens.find((c) => c.citizenId === id));
};
export const useStaff = () => {
  const id = useStore((s) => s.session.staffId);
  return useStore((s) => s.staff.find((c) => c.staffId === id));
};
export const useVerifier = () => {
  const id = useStore((s) => s.session.verifierId);
  return useStore((s) => s.staff.find((c) => c.staffId === id));
};
