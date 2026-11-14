import fs from 'fs';
import path from 'path';
import {
  AppNotification,
  CatalogService,
  ConsultantProfile,
  ServiceApprovalRecord,
  ServiceCategoryNode,
  ServiceOrder,
  ServiceReviewItem,
  User,
} from '../src/types';
import { INITIAL_CONSULTANTS, INITIAL_USERS } from '../src/data/mockData';
import {
  INITIAL_CATALOG_CATEGORIES,
  INITIAL_CATALOG_SERVICES,
  INITIAL_NOTIFICATIONS,
  INITIAL_SERVICE_APPROVALS,
  INITIAL_SERVICE_ORDERS,
  INITIAL_SERVICE_REVIEWS,
} from './servicesSeed';

export interface CatalogAuditRecord {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
}

export interface ServicesCatalogDatabase {
  categories: ServiceCategoryNode[];
  services: CatalogService[];
  orders: ServiceOrder[];
  reviews: ServiceReviewItem[];
  favorites: Record<string, string[]>; // userId -> serviceIds[]
  approvals: ServiceApprovalRecord[];
  notifications: AppNotification[];
  auditLogs: CatalogAuditRecord[];
}

const DB_FILE = path.resolve(process.cwd(), 'data', 'services_catalog_db.json');
const UPLOADS_DIR = path.resolve(process.cwd(), 'data', 'uploads');

function ensureDirs() {
  const dataDir = path.dirname(DB_FILE);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function createInitialDb(): ServicesCatalogDatabase {
  return {
    categories: JSON.parse(JSON.stringify(INITIAL_CATALOG_CATEGORIES)),
    services: JSON.parse(JSON.stringify(INITIAL_CATALOG_SERVICES)),
    orders: JSON.parse(JSON.stringify(INITIAL_SERVICE_ORDERS)),
    reviews: JSON.parse(JSON.stringify(INITIAL_SERVICE_REVIEWS)),
    favorites: {
      'user-client-1': ['cat-srv-1', 'cat-srv-3'],
    },
    approvals: JSON.parse(JSON.stringify(INITIAL_SERVICE_APPROVALS)),
    notifications: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)),
    auditLogs: [
      {
        id: 'clog-init-1',
        actorId: 'user-admin-1',
        actorRole: 'admin',
        action: 'CATALOG_INITIALIZED',
        entityType: 'system',
        entityId: 'services-catalog',
        details: 'تهيئة كتالوج الخدمات الاستشارية وربط 18 تصنيفاً رئيسياً بالمستشارين المعتمدين.',
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

let cachedDb: ServicesCatalogDatabase | null = null;

export function getCatalogDb(): ServicesCatalogDatabase {
  if (cachedDb) return cachedDb;
  ensureDirs();
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as ServicesCatalogDatabase;
      if (parsed && Array.isArray(parsed.categories) && Array.isArray(parsed.services)) {
        cachedDb = parsed;
        return cachedDb;
      }
    }
  } catch (err) {
    console.error('[WASEET Catalog DB] Failed to load JSON store, seeding fresh copy:', err);
  }
  cachedDb = createInitialDb();
  saveCatalogDb(cachedDb);
  return cachedDb;
}

export function saveCatalogDb(db: ServicesCatalogDatabase): void {
  ensureDirs();
  cachedDb = db;
  const tmpPath = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DB_FILE);
}

export function getKnownUsers(): User[] {
  return INITIAL_USERS;
}

export function getConsultantsList(): ConsultantProfile[] {
  return INITIAL_CONSULTANTS;
}

export function getVerificationStatusMap(): Record<string, 'pending' | 'verified' | 'rejected'> {
  const map: Record<string, 'pending' | 'verified' | 'rejected'> = {};
  for (const c of INITIAL_CONSULTANTS) {
    map[c.id] = c.verificationStatus;
  }
  return map;
}

export function getUploadsDir(): string {
  ensureDirs();
  return UPLOADS_DIR;
}

export function addNotification(
  db: ServicesCatalogDatabase,
  userId: string,
  title: string,
  message: string,
  type: AppNotification['type'] = 'order',
  linkUrl?: string
): AppNotification {
  const notif: AppNotification = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    title,
    message,
    type,
    linkUrl,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.unshift(notif);
  return notif;
}

export function appendAudit(
  db: ServicesCatalogDatabase,
  actorId: string,
  actorRole: string,
  action: string,
  entityType: string,
  entityId: string,
  details: string
) {
  db.auditLogs.unshift({
    id: `clog-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    actorId,
    actorRole,
    action,
    entityType,
    entityId,
    details,
    createdAt: new Date().toISOString(),
  });
}
