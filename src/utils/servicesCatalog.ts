import {
  CatalogDeliveryMode,
  CatalogService,
  ServiceOrderStatus,
  UserRole,
} from '../types';

export const SERVICE_PLATFORM_FEE_PERCENT = 15;
export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_ATTACHMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.xlsx', '.txt'];
export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'text/plain',
];

export interface ServiceCommissionBreakdown {
  priceEgp: number;
  totalPiasters: number;
  feePercent: number;
  feePiasters: number;
  feeEgp: number;
  netProviderPiasters: number;
  netProviderEgp: number;
}

export function calculateServiceCommissionPiasters(
  priceEgp: number,
  feePercent: number = SERVICE_PLATFORM_FEE_PERCENT
): ServiceCommissionBreakdown {
  if (!Number.isFinite(priceEgp) || priceEgp <= 0) {
    throw new Error('سعر الخدمة يجب أن يكون أكبر من صفر.');
  }
  if (!Number.isFinite(feePercent) || feePercent < 0 || feePercent > 50) {
    throw new Error('نسبة عمولة المنصة غير صالحة.');
  }
  const totalPiasters = Math.round(priceEgp * 100);
  const feePiasters = Math.round((totalPiasters * feePercent) / 100);
  const netProviderPiasters = totalPiasters - feePiasters;

  return {
    priceEgp: totalPiasters / 100,
    totalPiasters,
    feePercent,
    feePiasters,
    feeEgp: feePiasters / 100,
    netProviderPiasters,
    netProviderEgp: netProviderPiasters / 100,
  };
}

export function sanitizeText(input: string): string {
  if (!input) return '';
  return String(input)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

export function validateAttachment(file: {
  name: string;
  type: string;
  size: number;
}): { valid: boolean; error?: string } {
  const name = (file.name || '').trim();
  if (!name) {
    return { valid: false, error: 'اسم الملف غير صالح.' };
  }
  const lower = name.toLowerCase();
  const hasAllowedExt = ALLOWED_ATTACHMENT_EXTENSIONS.some((ext) => lower.endsWith(ext));
  if (!hasAllowedExt) {
    return {
      valid: false,
      error: `صيغة الملف غير مدعومة (${name}). الصيغ المسموحة: PDF, Word, Excel, PNG, JPG, TXT.`,
    };
  }
  if (file.type && !ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `نوع الملف (${file.type}) غير مسموح به لأسباب أمنية.`,
    };
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return { valid: false, error: 'الملف فارغ أو غير قابل للقراءة.' };
  }
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      valid: false,
      error: 'حجم الملف يتجاوز الحد الأقصى المسموح به (5 ميجابايت).',
    };
  }
  return { valid: true };
}

export function isServicePubliclyVisible(
  service: Pick<CatalogService, 'status' | 'requiresLicense' | 'deletedAt'>,
  providerVerificationStatus: 'pending' | 'verified' | 'rejected'
): boolean {
  if (service.deletedAt) return false;
  if (service.status !== 'published') return false;
  if (service.requiresLicense && providerVerificationStatus !== 'verified') {
    return false;
  }
  return true;
}

export interface CatalogQueryParams {
  q?: string;
  categoryId?: string;
  subcategoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  maxDays?: number;
  deliveryMode?: CatalogDeliveryMode | 'all' | '';
  verifiedOnly?: boolean;
  providerId?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'most_requested';
  section?: 'all' | 'most_requested' | 'featured' | 'recommended';
  page?: number;
  pageSize?: number;
}

export interface PaginatedCatalogResult {
  items: CatalogService[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function filterAndSortCatalogServices(
  services: CatalogService[],
  params: CatalogQueryParams,
  providerVerificationMap?: Record<string, 'pending' | 'verified' | 'rejected'>
): PaginatedCatalogResult {
  const q = (params.q || '').trim().toLowerCase();
  const minPrice = params.minPrice !== undefined && !Number.isNaN(params.minPrice) ? params.minPrice : 0;
  const maxPrice = params.maxPrice !== undefined && !Number.isNaN(params.maxPrice) ? params.maxPrice : Number.MAX_SAFE_INTEGER;
  const minRating = params.minRating !== undefined && !Number.isNaN(params.minRating) ? params.minRating : 0;
  const maxDays = params.maxDays !== undefined && !Number.isNaN(params.maxDays) ? params.maxDays : Number.MAX_SAFE_INTEGER;

  let filtered = services.filter((srv) => {
    const provStatus = providerVerificationMap
      ? providerVerificationMap[srv.consultantId] || (srv.providerVerified ? 'verified' : 'pending')
      : srv.providerVerified
      ? 'verified'
      : 'pending';

    if (!isServicePubliclyVisible(srv, provStatus)) return false;

    if (params.section === 'featured' && !srv.isFeatured) return false;
    if (params.section === 'recommended' && !srv.isRecommended) return false;

    if (params.categoryId && srv.categoryId !== params.categoryId) return false;
    if (params.subcategoryId && srv.subcategoryId !== params.subcategoryId) return false;
    if (params.providerId && srv.consultantId !== params.providerId) return false;

    if (srv.priceEgp < minPrice || srv.priceEgp > maxPrice) return false;
    if (srv.rating < minRating) return false;
    if (srv.executionDays > maxDays) return false;

    if (params.deliveryMode && params.deliveryMode !== 'all') {
      if (srv.deliveryMode !== params.deliveryMode && srv.deliveryMode !== 'both') {
        return false;
      }
    }

    if (params.verifiedOnly && provStatus !== 'verified') return false;

    if (q) {
      const haystacks = [
        srv.titleAr,
        srv.titleEn,
        srv.shortDescriptionAr,
        srv.shortDescriptionEn,
        srv.providerName,
        srv.categoryNameAr,
        srv.subcategoryNameAr,
        ...(srv.tags || []),
      ]
        .join(' ')
        .toLowerCase();
      if (!haystacks.includes(q)) return false;
    }

    return true;
  });

  const sort = params.sort || (params.section === 'most_requested' ? 'most_requested' : 'most_requested');
  filtered = [...filtered].sort((a, b) => {
    if (sort === 'price_asc') return a.priceEgp - b.priceEgp;
    if (sort === 'price_desc') return b.priceEgp - a.priceEgp;
    if (sort === 'rating') {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.reviewCount - a.reviewCount;
    }
    if (sort === 'most_requested') {
      if (b.ordersCount !== a.ordersCount) return b.ordersCount - a.ordersCount;
      return b.rating - a.rating;
    }
    // newest
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pageSize = Math.max(1, Math.min(50, params.pageSize || 9));
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.max(1, Math.min(totalPages, params.page || 1));
  const start = (page - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export const ALLOWED_ORDER_TRANSITIONS: Record<
  ServiceOrderStatus,
  { next: ServiceOrderStatus; roles: UserRole[] }[]
> = {
  pending: [
    { next: 'accepted', roles: ['consultant', 'admin'] },
    { next: 'awaiting_payment', roles: ['consultant', 'admin'] },
    { next: 'cancelled', roles: ['client', 'consultant', 'admin'] },
  ],
  accepted: [
    { next: 'awaiting_payment', roles: ['consultant', 'admin', 'client'] },
    { next: 'paid', roles: ['client', 'admin'] },
    { next: 'cancelled', roles: ['client', 'consultant', 'admin'] },
  ],
  awaiting_payment: [
    { next: 'paid', roles: ['client', 'admin'] },
    { next: 'cancelled', roles: ['client', 'admin'] },
  ],
  paid: [
    { next: 'in_progress', roles: ['consultant', 'admin'] },
    { next: 'disputed', roles: ['client', 'consultant', 'admin'] },
    { next: 'refunded', roles: ['admin'] },
  ],
  in_progress: [
    { next: 'delivered', roles: ['consultant', 'admin'] },
    { next: 'disputed', roles: ['client', 'consultant', 'admin'] },
    { next: 'cancelled', roles: ['admin'] },
  ],
  delivered: [
    { next: 'completed', roles: ['client', 'admin'] },
    { next: 'in_progress', roles: ['client', 'consultant', 'admin'] }, // revision requested
    { next: 'disputed', roles: ['client', 'consultant', 'admin'] },
  ],
  completed: [{ next: 'disputed', roles: ['client', 'admin'] }],
  cancelled: [],
  disputed: [
    { next: 'completed', roles: ['admin'] },
    { next: 'refunded', roles: ['admin'] },
    { next: 'in_progress', roles: ['admin'] },
  ],
  refunded: [],
};

export function canTransitionOrderStatus(
  current: ServiceOrderStatus,
  next: ServiceOrderStatus,
  actorRole: UserRole
): { allowed: boolean; reason?: string } {
  if (current === next) {
    return { allowed: false, reason: 'الطلب موجود بالفعل في هذه الحالة.' };
  }
  const rules = ALLOWED_ORDER_TRANSITIONS[current] || [];
  const match = rules.find((r) => r.next === next);
  if (!match) {
    return {
      allowed: false,
      reason: `لا يمكن نقل الطلب مباشرة من حالة "${current}" إلى "${next}".`,
    };
  }
  if (!match.roles.includes(actorRole)) {
    return {
      allowed: false,
      reason: `ليس لديك صلاحية تنفيذ الانتقال إلى حالة "${next}".`,
    };
  }
  return { allowed: true };
}

export function generateUniqueOrderNumber(date = new Date()): string {
  const year = date.getFullYear();
  const rand = Math.floor(10000 + Math.random() * 89999);
  return `SRV-ORD-${year}-${rand}`;
}

export const SERVICE_ORDER_STATUS_LABELS: Record<
  ServiceOrderStatus,
  { ar: string; en: string; badgeClass: string }
> = {
  pending: {
    ar: 'قيد المراجعة',
    en: 'Pending Review',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  accepted: {
    ar: 'مقبول من المستشار',
    en: 'Accepted',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  awaiting_payment: {
    ar: 'بانتظار السداد',
    en: 'Awaiting Payment',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  paid: {
    ar: 'تم الدفع',
    en: 'Paid',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  in_progress: {
    ar: 'جاري التنفيذ',
    en: 'In Progress',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  delivered: {
    ar: 'تم التسليم للمراجعة',
    en: 'Delivered',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  },
  completed: {
    ar: 'مكتمل ومعتمد',
    en: 'Completed',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  cancelled: {
    ar: 'ملغى',
    en: 'Cancelled',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  disputed: {
    ar: 'نزاع مفتوح',
    en: 'Disputed',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  refunded: {
    ar: 'مسترد للعميل',
    en: 'Refunded',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
};
