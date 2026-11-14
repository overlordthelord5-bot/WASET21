import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import {
  CatalogDeliveryMode,
  CatalogService,
  CatalogServiceStatus,
  ServiceOrder,
  ServiceOrderStatus,
  UserRole,
} from '../src/types';
import {
  calculateServiceCommissionPiasters,
  canTransitionOrderStatus,
  filterAndSortCatalogServices,
  generateUniqueOrderNumber,
  isServicePubliclyVisible,
  sanitizeText,
  SERVICE_PLATFORM_FEE_PERCENT,
  validateAttachment,
} from '../src/utils/servicesCatalog';
import {
  addNotification,
  appendAudit,
  getCatalogDb,
  getConsultantsList,
  getKnownUsers,
  getUploadsDir,
  getVerificationStatusMap,
  saveCatalogDb,
} from './servicesDb';

interface AuthActor {
  userId: string;
  role: UserRole;
  name: string;
  consultantId?: string;
}

const VALID_ROLES: UserRole[] = [
  'client',
  'consultant',
  'seller',
  'affiliate',
  'partner',
  'support',
  'admin',
];

function extractActor(req: Request): AuthActor | null {
  const userId = String(req.header('x-user-id') || '').trim();
  const roleHeader = String(req.header('x-user-role') || '').trim() as UserRole;
  const rawNameHeader = String(req.header('x-user-name') || '').trim();
  let decodedName = rawNameHeader;
  try {
    decodedName = decodeURIComponent(rawNameHeader);
  } catch {
    decodedName = rawNameHeader;
  }

  if (!userId || !roleHeader || !VALID_ROLES.includes(roleHeader)) {
    return null;
  }

  // Match against seeded users if present to prevent role spoofing for known IDs
  const known = getKnownUsers().find((u) => u.id === userId);
  const role = known ? known.role : roleHeader;
  const name = known ? known.name : sanitizeText(decodedName) || `مستخدم (${role})`;
  const consultant = getConsultantsList().find((c) => c.userId === userId);

  return {
    userId,
    role,
    name,
    consultantId: consultant?.id,
  };
}

function requireAuth(req: Request, res: Response): AuthActor | null {
  const actor = extractActor(req);
  if (!actor) {
    res.status(401).json({
      success: false,
      error: 'يجب تسجيل الدخول أولاً لإتمام هذا الإجراء.',
    });
    return null;
  }
  return actor;
}

function requireRole(actor: AuthActor, allowed: UserRole[], res: Response): boolean {
  if (!allowed.includes(actor.role)) {
    res.status(403).json({
      success: false,
      error: 'ليس لديك الصلاحية اللازمة للوصول إلى هذا المورد.',
    });
    return false;
  }
  return true;
}

export function createServicesRouter(): express.Router {
  const router = express.Router();

  // ---------------------------------------------------------------------------
  // 1. CATEGORIES (Public + Admin Dynamic CRUD)
  // ---------------------------------------------------------------------------
  router.get('/service-categories', (_req: Request, res: Response) => {
    const db = getCatalogDb();
    const verMap = getVerificationStatusMap();

    const activeServices = db.services.filter((s) =>
      isServicePubliclyVisible(s, verMap[s.consultantId] || (s.providerVerified ? 'verified' : 'pending'))
    );

    const categories = db.categories
      .filter((c) => c.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((cat) => ({
        ...cat,
        subcategories: (cat.subcategories || []).filter((sc) => sc.isActive),
        serviceCount: activeServices.filter((s) => s.categoryId === cat.id).length,
      }));

    res.json({ success: true, categories });
  });

  router.get('/admin/service-categories', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor || !requireRole(actor, ['admin'], res)) return;
    const db = getCatalogDb();
    res.json({ success: true, categories: db.categories });
  });

  router.post('/admin/service-categories', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor || !requireRole(actor, ['admin'], res)) return;

    const db = getCatalogDb();
    const nameAr = sanitizeText(req.body.nameAr);
    const nameEn = sanitizeText(req.body.nameEn) || nameAr;
    const descriptionAr = sanitizeText(req.body.descriptionAr || '');
    const descriptionEn = sanitizeText(req.body.descriptionEn || '');
    const parentId = req.body.parentId ? String(req.body.parentId) : null;
    const requiresLicense = Boolean(req.body.requiresLicense);
    const iconName = sanitizeText(req.body.iconName || 'Briefcase');

    if (!nameAr) {
      return res.status(400).json({ success: false, error: 'اسم التصنيف بالعربية مطلوب.' });
    }

    if (parentId) {
      const parent = db.categories.find((c) => c.id === parentId);
      if (!parent) {
        return res.status(404).json({ success: false, error: 'التصنيف الرئيسي غير موجود.' });
      }
      const subId = `ssub-${Date.now()}`;
      const newSub = {
        id: subId,
        parentId,
        slug: sanitizeText(req.body.slug || `sub-${Date.now()}`).toLowerCase().replace(/\s+/g, '-'),
        nameAr,
        nameEn,
        isActive: true,
      };
      parent.subcategories.push(newSub);
      appendAudit(db, actor.userId, actor.role, 'CREATE_SUBCATEGORY', 'service_category', subId, `إضافة تصنيف فرعي: ${nameAr}`);
      saveCatalogDb(db);
      return res.status(201).json({ success: true, subcategory: newSub, categories: db.categories });
    }

    const catId = `scat-${Date.now()}`;
    const newCat = {
      id: catId,
      slug: sanitizeText(req.body.slug || `cat-${Date.now()}`).toLowerCase().replace(/\s+/g, '-'),
      nameAr,
      nameEn,
      descriptionAr,
      descriptionEn,
      iconName,
      requiresLicense,
      displayOrder: db.categories.length + 1,
      isActive: true,
      subcategories: [],
    };

    db.categories.push(newCat);
    appendAudit(db, actor.userId, actor.role, 'CREATE_CATEGORY', 'service_category', catId, `إضافة تصنيف رئيسي: ${nameAr}`);
    saveCatalogDb(db);
    return res.status(201).json({ success: true, category: newCat, categories: db.categories });
  });

  router.patch('/admin/service-categories/:id', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor || !requireRole(actor, ['admin'], res)) return;

    const db = getCatalogDb();
    const { id } = req.params;
    const cat = db.categories.find((c) => c.id === id);

    if (cat) {
      if (req.body.nameAr !== undefined) cat.nameAr = sanitizeText(req.body.nameAr);
      if (req.body.nameEn !== undefined) cat.nameEn = sanitizeText(req.body.nameEn);
      if (req.body.descriptionAr !== undefined) cat.descriptionAr = sanitizeText(req.body.descriptionAr);
      if (req.body.requiresLicense !== undefined) cat.requiresLicense = Boolean(req.body.requiresLicense);
      if (req.body.isActive !== undefined) cat.isActive = Boolean(req.body.isActive);
      appendAudit(db, actor.userId, actor.role, 'UPDATE_CATEGORY', 'service_category', id, `تحديث تصنيف: ${cat.nameAr}`);
      saveCatalogDb(db);
      return res.json({ success: true, category: cat });
    }

    // Check subcategories
    for (const parent of db.categories) {
      const sub = parent.subcategories.find((s) => s.id === id);
      if (sub) {
        if (req.body.nameAr !== undefined) sub.nameAr = sanitizeText(req.body.nameAr);
        if (req.body.nameEn !== undefined) sub.nameEn = sanitizeText(req.body.nameEn);
        if (req.body.isActive !== undefined) sub.isActive = Boolean(req.body.isActive);
        appendAudit(db, actor.userId, actor.role, 'UPDATE_SUBCATEGORY', 'service_category', id, `تحديث تصنيف فرعي: ${sub.nameAr}`);
        saveCatalogDb(db);
        return res.json({ success: true, subcategory: sub });
      }
    }

    return res.status(404).json({ success: false, error: 'التصنيف غير موجود.' });
  });

  router.delete('/admin/service-categories/:id', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor || !requireRole(actor, ['admin'], res)) return;

    const db = getCatalogDb();
    const { id } = req.params;
    const cat = db.categories.find((c) => c.id === id);
    if (cat) {
      cat.isActive = false;
      appendAudit(db, actor.userId, actor.role, 'DEACTIVATE_CATEGORY', 'service_category', id, `تعطيل تصنيف: ${cat.nameAr}`);
      saveCatalogDb(db);
      return res.json({ success: true });
    }
    return res.status(404).json({ success: false, error: 'التصنيف غير موجود.' });
  });

  // ---------------------------------------------------------------------------
  // 2. PUBLIC CATALOG LISTING, SEARCH, FILTERING & SERVICE DETAILS
  // ---------------------------------------------------------------------------
  router.get('/services', (req: Request, res: Response) => {
    const db = getCatalogDb();
    const verMap = getVerificationStatusMap();

    const result = filterAndSortCatalogServices(
      db.services,
      {
        q: typeof req.query.q === 'string' ? req.query.q : undefined,
        categoryId: typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined,
        subcategoryId: typeof req.query.subcategoryId === 'string' ? req.query.subcategoryId : undefined,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        minRating: req.query.minRating ? Number(req.query.minRating) : undefined,
        maxDays: req.query.maxDays ? Number(req.query.maxDays) : undefined,
        deliveryMode: (req.query.deliveryMode as CatalogDeliveryMode | 'all') || undefined,
        verifiedOnly: req.query.verifiedOnly === 'true',
        providerId: typeof req.query.providerId === 'string' ? req.query.providerId : undefined,
        sort: (req.query.sort as any) || 'most_requested',
        section: (req.query.section as any) || 'all',
        page: req.query.page ? Number(req.query.page) : 1,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : 9,
      },
      verMap
    );

    const actor = extractActor(req);
    const favIds = actor ? db.favorites[actor.userId] || [] : [];

    res.json({
      success: true,
      ...result,
      favoriteIds: favIds,
    });
  });

  router.get('/services/:id', (req: Request, res: Response) => {
    const db = getCatalogDb();
    const verMap = getVerificationStatusMap();
    const service = db.services.find((s) => s.id === req.params.id && !s.deletedAt);

    if (!service) {
      return res.status(404).json({ success: false, error: 'الخدمة الاستشارية غير موجودة.' });
    }

    const actor = extractActor(req);
    const isOwnerOrAdmin =
      actor &&
      (actor.role === 'admin' ||
        actor.userId === service.providerUserId ||
        (actor.consultantId && actor.consultantId === service.consultantId));

    const provStatus = verMap[service.consultantId] || (service.providerVerified ? 'verified' : 'pending');
    if (!isOwnerOrAdmin && !isServicePubliclyVisible(service, provStatus)) {
      return res.status(404).json({
        success: false,
        error: 'هذه الخدمة غير متاحة للعرض العام حالياً.',
      });
    }

    const provider = getConsultantsList().find((c) => c.id === service.consultantId) || null;
    const reviews = db.reviews.filter((r) => r.serviceId === service.id);
    const similarServices = db.services
      .filter(
        (s) =>
          s.id !== service.id &&
          isServicePubliclyVisible(s, verMap[s.consultantId] || (s.providerVerified ? 'verified' : 'pending')) &&
          (s.categoryId === service.categoryId || s.consultantId === service.consultantId)
      )
      .slice(0, 3);

    const favIds = actor ? db.favorites[actor.userId] || [] : [];

    return res.json({
      success: true,
      service,
      provider,
      reviews,
      similarServices,
      isFavorited: favIds.includes(service.id),
    });
  });

  // ---------------------------------------------------------------------------
  // 3. PROVIDER SERVICE MANAGEMENT (Consultant Role)
  // ---------------------------------------------------------------------------
  router.get('/provider/services', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor || !requireRole(actor, ['consultant', 'admin'], res)) return;

    const db = getCatalogDb();
    const myServices =
      actor.role === 'admin'
        ? db.services.filter((s) => !s.deletedAt)
        : db.services.filter(
            (s) =>
              !s.deletedAt &&
              (s.providerUserId === actor.userId || (actor.consultantId && s.consultantId === actor.consultantId))
          );

    return res.json({ success: true, services: myServices });
  });

  router.post('/provider/services', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor || !requireRole(actor, ['consultant', 'admin'], res)) return;

    const db = getCatalogDb();
    const consultant =
      getConsultantsList().find((c) => c.userId === actor.userId || c.id === actor.consultantId) ||
      getConsultantsList()[0];

    const titleAr = sanitizeText(req.body.titleAr);
    const titleEn = sanitizeText(req.body.titleEn || titleAr);
    const shortDescriptionAr = sanitizeText(req.body.shortDescriptionAr || '');
    const fullDescriptionAr = sanitizeText(req.body.fullDescriptionAr || shortDescriptionAr);
    const categoryId = String(req.body.categoryId || '');
    const subcategoryId = String(req.body.subcategoryId || '');
    const priceEgp = Number(req.body.priceEgp);
    const executionDays = Math.max(1, Number(req.body.executionDays || 3));
    const deliveryMode: CatalogDeliveryMode =
      req.body.deliveryMode === 'in_person' || req.body.deliveryMode === 'both' ? req.body.deliveryMode : 'online';
    const revisionsCount = Math.max(0, Number(req.body.revisionsCount ?? 2));

    if (!titleAr || titleAr.length < 5) {
      return res.status(400).json({ success: false, error: 'عنوان الخدمة مطلوب (5 أحرف على الأقل).' });
    }
    if (!shortDescriptionAr || shortDescriptionAr.length < 10) {
      return res.status(400).json({ success: false, error: 'الوصف المختصر للخدمة مطلوب.' });
    }
    if (!Number.isFinite(priceEgp) || priceEgp < 50) {
      return res.status(400).json({ success: false, error: 'سعر الخدمة يجب أن يكون 50 ج.م على الأقل.' });
    }

    const cat = db.categories.find((c) => c.id === categoryId && c.isActive);
    if (!cat) {
      return res.status(400).json({ success: false, error: 'التصنيف المحدد غير صالح.' });
    }

    const sub = cat.subcategories.find((s) => s.id === subcategoryId) || cat.subcategories[0];

    // Professional licensing enforcement: only verified consultants can create license-required services
    const requiresLicense = Boolean(req.body.requiresLicense ?? cat.requiresLicense);
    if (requiresLicense && consultant.verificationStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        error: 'هذا التصنيف يتطلب ترخيصاً مهنياً موثقاً. يرجى استكمال توثيق حسابك أولاً.',
      });
    }

    const safeImageUrl =
      typeof req.body.imageUrl === 'string' &&
      (req.body.imageUrl.startsWith('/src/assets/images/') || req.body.imageUrl.startsWith('/api/uploads/'))
        ? req.body.imageUrl
        : '/src/assets/images/service_tax_finance_1794569785276.jpg';

    const sanitizeArray = (arr: any): string[] =>
      Array.isArray(arr) ? arr.map((x) => sanitizeText(String(x))).filter(Boolean) : [];

    const now = new Date().toISOString();
    const id = `cat-srv-${Date.now()}`;
    const newService: CatalogService = {
      id,
      slug: `srv-${Date.now()}`,
      consultantId: consultant.id,
      providerUserId: actor.userId,
      providerName: consultant.nameAr,
      providerTitle: consultant.titleAr,
      providerAvatar: consultant.avatar,
      providerVerified: consultant.verificationStatus === 'verified',
      categoryId: cat.id,
      categoryNameAr: cat.nameAr,
      categoryNameEn: cat.nameEn,
      subcategoryId: sub ? sub.id : '',
      subcategoryNameAr: sub ? sub.nameAr : cat.nameAr,
      subcategoryNameEn: sub ? sub.nameEn : cat.nameEn,
      titleAr,
      titleEn,
      shortDescriptionAr,
      shortDescriptionEn: sanitizeText(req.body.shortDescriptionEn || shortDescriptionAr),
      fullDescriptionAr,
      fullDescriptionEn: sanitizeText(req.body.fullDescriptionEn || fullDescriptionAr),
      imageUrl: safeImageUrl,
      priceEgp: Math.round(priceEgp),
      pricePiasters: Math.round(priceEgp * 100),
      executionDays,
      deliveryMode,
      revisionsCount,
      includedAr: sanitizeArray(req.body.includedAr),
      excludedAr: sanitizeArray(req.body.excludedAr),
      prerequisitesAr: sanitizeArray(req.body.prerequisitesAr),
      deliverablesAr: sanitizeArray(req.body.deliverablesAr),
      milestones: Array.isArray(req.body.milestones)
        ? req.body.milestones.map((m: any, idx: number) => ({
            id: `ms-${Date.now()}-${idx}`,
            stepNumber: idx + 1,
            titleAr: sanitizeText(m.titleAr || `المرحلة ${idx + 1}`),
            titleEn: sanitizeText(m.titleEn || `Step ${idx + 1}`),
            descriptionAr: sanitizeText(m.descriptionAr || ''),
            durationDays: Math.max(1, Number(m.durationDays || 1)),
          }))
        : [],
      faqs: Array.isArray(req.body.faqs)
        ? req.body.faqs.map((f: any, idx: number) => ({
            id: `faq-${Date.now()}-${idx}`,
            questionAr: sanitizeText(f.questionAr || ''),
            questionEn: sanitizeText(f.questionEn || ''),
            answerAr: sanitizeText(f.answerAr || ''),
            answerEn: sanitizeText(f.answerEn || ''),
          }))
        : [],
      tags: sanitizeArray(req.body.tags),
      requiresLicense,
      isFeatured: false,
      isRecommended: false,
      isDemo: false,
      // New provider services ALWAYS start as pending_review unless explicitly draft
      status: req.body.status === 'draft' ? 'draft' : 'pending_review',
      rating: 5.0,
      reviewCount: 0,
      ordersCount: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    db.services.unshift(newService);
    appendAudit(
      db,
      actor.userId,
      actor.role,
      'PROVIDER_CREATE_SERVICE',
      'service',
      id,
      `إضافة خدمة جديدة "${titleAr}" بحالة ${newService.status}`
    );
    addNotification(
      db,
      'user-admin-1',
      'خدمة جديدة بانتظار المراجعة',
      `أضاف المستشار ${consultant.nameAr} خدمة "${titleAr}" للمراجعة والاعتماد.`,
      'approval',
      '/dashboard'
    );
    saveCatalogDb(db);

    return res.status(201).json({ success: true, service: newService });
  });

  router.patch('/provider/services/:id', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor || !requireRole(actor, ['consultant', 'admin'], res)) return;

    const db = getCatalogDb();
    const service = db.services.find((s) => s.id === req.params.id && !s.deletedAt);
    if (!service) {
      return res.status(404).json({ success: false, error: 'الخدمة غير موجودة.' });
    }

    // IDOR enforcement
    const isOwner =
      actor.role === 'admin' ||
      service.providerUserId === actor.userId ||
      (actor.consultantId && actor.consultantId === service.consultantId);

    if (!isOwner) {
      return res.status(403).json({ success: false, error: 'لا تملك صلاحية تعديل خدمة مستشار آخر.' });
    }

    if (req.body.titleAr !== undefined) service.titleAr = sanitizeText(req.body.titleAr);
    if (req.body.shortDescriptionAr !== undefined) service.shortDescriptionAr = sanitizeText(req.body.shortDescriptionAr);
    if (req.body.fullDescriptionAr !== undefined) service.fullDescriptionAr = sanitizeText(req.body.fullDescriptionAr);
    if (req.body.priceEgp !== undefined) {
      const p = Number(req.body.priceEgp);
      if (!Number.isFinite(p) || p < 50) {
        return res.status(400).json({ success: false, error: 'السعر غير صالح.' });
      }
      service.priceEgp = Math.round(p);
      service.pricePiasters = Math.round(p * 100);
    }
    if (req.body.executionDays !== undefined) service.executionDays = Math.max(1, Number(req.body.executionDays));
    if (req.body.deliveryMode === 'online' || req.body.deliveryMode === 'in_person' || req.body.deliveryMode === 'both') {
      service.deliveryMode = req.body.deliveryMode;
    }
    if (
      req.body.status === 'paused' ||
      req.body.status === 'pending_review' ||
      req.body.status === 'draft' ||
      (req.body.status === 'published' && service.status === 'paused')
    ) {
      service.status = req.body.status;
    }

    service.updatedAt = new Date().toISOString();
    appendAudit(db, actor.userId, actor.role, 'PROVIDER_UPDATE_SERVICE', 'service', service.id, `تعديل الخدمة: ${service.titleAr}`);
    saveCatalogDb(db);

    return res.json({ success: true, service });
  });

  router.delete('/provider/services/:id', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor || !requireRole(actor, ['consultant', 'admin'], res)) return;

    const db = getCatalogDb();
    const service = db.services.find((s) => s.id === req.params.id && !s.deletedAt);
    if (!service) {
      return res.status(404).json({ success: false, error: 'الخدمة غير موجودة.' });
    }

    const isOwner =
      actor.role === 'admin' ||
      service.providerUserId === actor.userId ||
      (actor.consultantId && actor.consultantId === service.consultantId);

    if (!isOwner) {
      return res.status(403).json({ success: false, error: 'لا تملك صلاحية حذف خدمة مستشار آخر.' });
    }

    service.deletedAt = new Date().toISOString();
    service.status = 'paused';
    appendAudit(db, actor.userId, actor.role, 'PROVIDER_DELETE_SERVICE', 'service', service.id, `حذف (أرشفة) الخدمة: ${service.titleAr}`);
    saveCatalogDb(db);

    return res.json({ success: true });
  });

  // ---------------------------------------------------------------------------
  // 4. ADMIN CATALOG GOVERNANCE, APPROVALS & REPORTS
  // ---------------------------------------------------------------------------
  router.get('/admin/services', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor || !requireRole(actor, ['admin'], res)) return;

    const db = getCatalogDb();
    res.json({
      success: true,
      services: db.services.filter((s) => !s.deletedAt),
      approvals: db.approvals,
    });
  });

  router.patch('/admin/services/:id/review', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor || !requireRole(actor, ['admin'], res)) return;

    const db = getCatalogDb();
    const service = db.services.find((s) => s.id === req.params.id && !s.deletedAt);
    if (!service) {
      return res.status(404).json({ success: false, error: 'الخدمة غير موجودة.' });
    }

    const decision = String(req.body.decision || '');
    const reason = sanitizeText(req.body.reason || '');

    if (!['approve', 'reject', 'suspend', 'feature', 'unfeature'].includes(decision)) {
      return res.status(400).json({ success: false, error: 'قرار المراجعة غير صالح.' });
    }

    if ((decision === 'reject' || decision === 'suspend') && !reason) {
      return res.status(400).json({ success: false, error: 'يرجى كتابة سبب الرفض أو الإيقاف.' });
    }

    if (decision === 'approve') {
      const verMap = getVerificationStatusMap();
      const provStatus = verMap[service.consultantId] || (service.providerVerified ? 'verified' : 'pending');
      if (service.requiresLicense && provStatus !== 'verified') {
        return res.status(400).json({
          success: false,
          error: 'لا يمكن اعتماد خدمة تتطلب ترخيصاً مهنياً لمقدم خدمة غير موثق.',
        });
      }
      service.status = 'published';
      service.rejectionReason = undefined;
    } else if (decision === 'reject') {
      service.status = 'rejected';
      service.rejectionReason = reason;
    } else if (decision === 'suspend') {
      service.status = 'suspended';
      service.rejectionReason = reason;
    } else if (decision === 'feature') {
      service.isFeatured = true;
    } else if (decision === 'unfeature') {
      service.isFeatured = false;
    }

    service.updatedAt = new Date().toISOString();

    if (decision === 'approve' || decision === 'reject' || decision === 'suspend') {
      const approvalDecision =
        decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'suspended';
      db.approvals.unshift({
        id: `appr-${Date.now()}`,
        serviceId: service.id,
        serviceTitle: service.titleAr,
        providerName: service.providerName,
        adminId: actor.userId,
        adminName: actor.name,
        decision: approvalDecision,
        reason: reason || 'تمت الموافقة ومطابقة المعايير المهنية.',
        createdAt: new Date().toISOString(),
      });

      addNotification(
        db,
        service.providerUserId,
        decision === 'approve'
          ? `تمت الموافقة ونشر خدمتك: ${service.titleAr}`
          : `تحديث بخصوص خدمتك: ${service.titleAr}`,
        decision === 'approve'
          ? 'تم اعتماد خدمتك في كتالوج الخدمات الاستشارية وأصبحت متاحة لطلبات العملاء.'
          : `تم تحديث حالة الخدمة (${approvalDecision}). السبب: ${reason}`,
        'approval',
        `/services/${service.id}`
      );
    }

    appendAudit(
      db,
      actor.userId,
      actor.role,
      `ADMIN_SERVICE_${decision.toUpperCase()}`,
      'service',
      service.id,
      `${decision} للخدمة "${service.titleAr}"${reason ? ` - السبب: ${reason}` : ''}`
    );
    saveCatalogDb(db);

    return res.json({ success: true, service, approvals: db.approvals });
  });

  router.get('/admin/catalog-reports', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor || !requireRole(actor, ['admin'], res)) return;

    const db = getCatalogDb();
    const activeOrders = db.orders.filter((o) => !['cancelled', 'refunded'].includes(o.status));
    const totalSalesPiasters = activeOrders.reduce((acc, o) => acc + o.totalPiasters, 0);
    const totalCommissionPiasters = activeOrders.reduce((acc, o) => acc + o.platformFeePiasters, 0);
    const totalNetProvidersPiasters = activeOrders.reduce((acc, o) => acc + o.netProviderPiasters, 0);

    res.json({
      success: true,
      summary: {
        totalServices: db.services.filter((s) => !s.deletedAt).length,
        publishedServices: db.services.filter((s) => !s.deletedAt && s.status === 'published').length,
        pendingReviewServices: db.services.filter((s) => !s.deletedAt && s.status === 'pending_review').length,
        totalOrders: db.orders.length,
        activeOrCompletedOrders: activeOrders.length,
        disputedOrders: db.orders.filter((o) => o.status === 'disputed').length,
        totalSalesPiasters,
        totalSalesEgp: totalSalesPiasters / 100,
        totalCommissionPiasters,
        totalCommissionEgp: totalCommissionPiasters / 100,
        totalNetProvidersPiasters,
        totalNetProvidersEgp: totalNetProvidersPiasters / 100,
      },
      auditLogs: db.auditLogs.slice(0, 60),
    });
  });

  // ---------------------------------------------------------------------------
  // 5. SERVICE ORDERS (10-Status Machine, Server-Side 15% Piasters, Idempotency)
  // ---------------------------------------------------------------------------
  router.get('/service-orders', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor) return;

    const db = getCatalogDb();
    let list: ServiceOrder[];
    if (actor.role === 'admin' || actor.role === 'support') {
      list = db.orders;
    } else if (actor.role === 'consultant') {
      list = db.orders.filter(
        (o) => o.providerUserId === actor.userId || (actor.consultantId && o.consultantId === actor.consultantId)
      );
    } else {
      list = db.orders.filter((o) => o.clientId === actor.userId);
    }

    res.json({ success: true, orders: list });
  });

  router.get('/service-orders/:id', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor) return;

    const db = getCatalogDb();
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'طلب الخدمة غير موجود.' });
    }

    const canAccess =
      actor.role === 'admin' ||
      actor.role === 'support' ||
      order.clientId === actor.userId ||
      order.providerUserId === actor.userId ||
      (actor.consultantId && order.consultantId === actor.consultantId);

    if (!canAccess) {
      return res.status(403).json({ success: false, error: 'ليس لديك صلاحية الاطلاع على هذا الطلب.' });
    }

    res.json({ success: true, order });
  });

  router.post('/service-orders', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor) return;

    const db = getCatalogDb();
    const verMap = getVerificationStatusMap();

    const serviceId = String(req.body.serviceId || '');
    const clientNotes = sanitizeText(req.body.clientNotes || '');
    const packageId = req.body.packageId ? String(req.body.packageId) : undefined;
    const requestedDeliveryMode = req.body.deliveryMode as CatalogDeliveryMode | undefined;

    if (!serviceId) {
      return res.status(400).json({ success: false, error: 'معرف الخدمة مطلوب.' });
    }
    if (!clientNotes || clientNotes.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'يرجى كتابة تفاصيل احتياجك للخدمة (10 أحرف على الأقل).',
      });
    }

    const service = db.services.find((s) => s.id === serviceId && !s.deletedAt);
    if (!service) {
      return res.status(404).json({ success: false, error: 'الخدمة المطلوبة غير موجودة.' });
    }

    const provStatus = verMap[service.consultantId] || (service.providerVerified ? 'verified' : 'pending');
    if (!isServicePubliclyVisible(service, provStatus)) {
      return res.status(400).json({
        success: false,
        error: 'هذه الخدمة غير متاحة للطلب في الوقت الحالي.',
      });
    }

    // Server-side authoritative pricing: NEVER trust client-supplied price or commission!
    const selectedPackage = packageId && service.packages ? service.packages.find((p) => p.id === packageId) : undefined;
    const authoritativePriceEgp = selectedPackage ? selectedPackage.priceEgp : service.priceEgp;
    const authoritativeDays = selectedPackage ? selectedPackage.executionDays : service.executionDays;

    const breakdown = calculateServiceCommissionPiasters(authoritativePriceEgp, SERVICE_PLATFORM_FEE_PERCENT);

    const attachments = Array.isArray(req.body.attachments)
      ? req.body.attachments.slice(0, 5).map((att: any, idx: number) => ({
          id: `att-${Date.now()}-${idx}`,
          name: sanitizeText(String(att.name || 'attachment.pdf')),
          mimeType: sanitizeText(String(att.mimeType || 'application/pdf')),
          sizeBytes: Math.min(5 * 1024 * 1024, Math.max(1, Number(att.sizeBytes || 1024))),
          url: sanitizeText(String(att.url || '')),
          uploadedBy: actor.userId,
          uploadedAt: new Date().toISOString(),
        }))
      : [];

    const now = new Date().toISOString();
    const orderId = `srv-ord-${Date.now()}`;
    const orderNumber = generateUniqueOrderNumber();

    const newOrder: ServiceOrder = {
      id: orderId,
      orderNumber,
      serviceId: service.id,
      serviceTitleAr: service.titleAr,
      serviceImageUrl: service.imageUrl,
      categoryId: service.categoryId,
      clientId: actor.userId,
      clientName: actor.name,
      consultantId: service.consultantId,
      providerUserId: service.providerUserId,
      providerName: service.providerName,
      deliveryMode:
        requestedDeliveryMode === 'online' || requestedDeliveryMode === 'in_person'
          ? requestedDeliveryMode
          : service.deliveryMode,
      packageName: selectedPackage?.nameAr,
      clientNotes,
      attachments,
      deliverables: [],
      events: [
        {
          id: `evt-${Date.now()}`,
          orderId,
          fromStatus: null,
          toStatus: 'pending',
          actorId: actor.userId,
          actorName: actor.name,
          actorRole: actor.role,
          note: 'تم إنشاء طلب الخدمة وإرساله إلى مقدم الخدمة.',
          createdAt: now,
        },
      ],
      priceEgp: breakdown.priceEgp,
      totalPiasters: breakdown.totalPiasters,
      platformFeePercent: SERVICE_PLATFORM_FEE_PERCENT,
      platformFeeEgp: breakdown.feeEgp,
      platformFeePiasters: breakdown.feePiasters,
      netProviderEgp: breakdown.netProviderEgp,
      netProviderPiasters: breakdown.netProviderPiasters,
      status: 'pending',
      executionDays: authoritativeDays,
      createdAt: now,
      updatedAt: now,
    };

    db.orders.unshift(newOrder);
    service.ordersCount += 1;

    addNotification(
      db,
      actor.userId,
      `تم إرسال طلبك #${orderNumber}`,
      `تم تسجيل طلب خدمة "${service.titleAr}" بقيمة ${breakdown.priceEgp.toLocaleString('ar-EG')} ج.م بنجاح.`,
      'order',
      '/dashboard'
    );
    addNotification(
      db,
      service.providerUserId,
      `طلب خدمة جديد #${orderNumber}`,
      `طلب العميل ${actor.name} خدمة "${service.titleAr}" (صافي مستحقاتك: ${breakdown.netProviderEgp.toLocaleString('ar-EG')} ج.م).`,
      'order',
      '/dashboard'
    );

    appendAudit(
      db,
      actor.userId,
      actor.role,
      'CREATE_SERVICE_ORDER',
      'service_order',
      orderId,
      `إنشاء طلب خدمة #${orderNumber} بقيمة ${breakdown.priceEgp} ج.م (عمولة ${breakdown.feeEgp} ج.م)`
    );
    saveCatalogDb(db);

    return res.status(201).json({ success: true, order: newOrder });
  });

  router.post('/service-orders/:id/pay', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor) return;

    const db = getCatalogDb();
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود.' });
    }
    if (order.clientId !== actor.userId && actor.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'فقط صاحب الطلب يمكنه تأكيد السداد.' });
    }

    const idempotencyKey = sanitizeText(String(req.header('idempotency-key') || req.body.idempotencyKey || ''));
    if (!idempotencyKey) {
      return res.status(400).json({ success: false, error: 'مفتاح منع التكرار (Idempotency-Key) مطلوب.' });
    }

    if (order.idempotencyKey === idempotencyKey || order.status === 'paid') {
      return res.json({ success: true, idempotentReplay: true, order });
    }

    if (!['pending', 'accepted', 'awaiting_payment'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: `لا يمكن سداد الطلب وهو في حالة "${order.status}".`,
      });
    }

    const method = req.body.paymentMethod;
    const validMethod =
      method === 'fawry' || method === 'vodafone_cash' || method === 'meeza' || method === 'card_online'
        ? method
        : 'card_online';

    const hasLiveGateway = Boolean(process.env.PAYMOB_API_KEY || process.env.FAWRY_MERCHANT_CODE);
    const paymentModeLabel = hasLiveGateway
      ? `تم التأكيد عبر بوابة الدفع (${validMethod})`
      : 'تأكيد محاكاة محلي (بانتظار ربط مفاتيح بوابة الدفع الحية)';

    const prevStatus = order.status;
    const now = new Date().toISOString();
    order.status = 'paid';
    order.paymentMethod = validMethod;
    order.paymentModeLabel = paymentModeLabel;
    order.idempotencyKey = idempotencyKey;
    order.paidAt = now;
    order.updatedAt = now;

    order.events.push({
      id: `evt-${Date.now()}`,
      orderId: order.id,
      fromStatus: prevStatus,
      toStatus: 'paid',
      actorId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      note: `تأكيد سداد قيمة الطلب (${order.priceEgp} ج.م) - ${paymentModeLabel}`,
      createdAt: now,
    });

    addNotification(
      db,
      order.providerUserId,
      `تم سداد الطلب #${order.orderNumber}`,
      `أكد العميل ${order.clientName} السداد على طلب "${order.serviceTitleAr}". يمكنك الآن بدء التنفيذ.`,
      'payment',
      '/dashboard'
    );

    appendAudit(
      db,
      actor.userId,
      actor.role,
      'PAY_SERVICE_ORDER',
      'service_order',
      order.id,
      `تأكيد دفع الطلب #${order.orderNumber} (${order.totalPiasters} قرش) - ${paymentModeLabel}`
    );
    saveCatalogDb(db);

    return res.json({ success: true, order });
  });

  router.patch('/service-orders/:id/status', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor) return;

    const db = getCatalogDb();
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود.' });
    }

    const isParticipant =
      actor.role === 'admin' ||
      order.clientId === actor.userId ||
      order.providerUserId === actor.userId ||
      (actor.consultantId && order.consultantId === actor.consultantId);

    if (!isParticipant) {
      return res.status(403).json({ success: false, error: 'لا تملك صلاحية تعديل هذا الطلب.' });
    }

    const nextStatus = String(req.body.status || '') as ServiceOrderStatus;
    const note = sanitizeText(req.body.note || '') || `تحديث حالة الطلب إلى ${nextStatus}`;

    const check = canTransitionOrderStatus(order.status, nextStatus, actor.role);
    if (!check.allowed) {
      return res.status(400).json({ success: false, error: check.reason });
    }

    const prevStatus = order.status;
    const now = new Date().toISOString();
    order.status = nextStatus;
    order.updatedAt = now;

    order.events.push({
      id: `evt-${Date.now()}`,
      orderId: order.id,
      fromStatus: prevStatus,
      toStatus: nextStatus,
      actorId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      note,
      createdAt: now,
    });

    const recipientUserId = actor.userId === order.clientId ? order.providerUserId : order.clientId;
    addNotification(
      db,
      recipientUserId,
      `تحديث حالة الطلب #${order.orderNumber}`,
      note,
      'order',
      '/dashboard'
    );

    appendAudit(
      db,
      actor.userId,
      actor.role,
      'UPDATE_SERVICE_ORDER_STATUS',
      'service_order',
      order.id,
      `تحويل الطلب #${order.orderNumber} من ${prevStatus} إلى ${nextStatus}`
    );
    saveCatalogDb(db);

    return res.json({ success: true, order });
  });

  router.post('/service-orders/:id/deliverables', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor || !requireRole(actor, ['consultant', 'admin'], res)) return;

    const db = getCatalogDb();
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود.' });
    }

    const isOwner =
      actor.role === 'admin' ||
      order.providerUserId === actor.userId ||
      (actor.consultantId && order.consultantId === actor.consultantId);
    if (!isOwner) {
      return res.status(403).json({ success: false, error: 'غير مصرح لك بتسليم مخرجات هذا الطلب.' });
    }

    const title = sanitizeText(req.body.title);
    const notes = sanitizeText(req.body.notes || '');
    if (!title) {
      return res.status(400).json({ success: false, error: 'عنوان المخرج النهائي مطلوب.' });
    }

    const now = new Date().toISOString();
    const deliverable = {
      id: `sdel-${Date.now()}`,
      title,
      notes,
      fileUrl: req.body.fileUrl ? sanitizeText(String(req.body.fileUrl)) : undefined,
      fileName: req.body.fileName ? sanitizeText(String(req.body.fileName)) : undefined,
      submittedAt: now,
    };

    const prevStatus = order.status;
    order.deliverables.push(deliverable);
    order.status = 'delivered';
    order.updatedAt = now;
    order.events.push({
      id: `evt-${Date.now()}`,
      orderId: order.id,
      fromStatus: prevStatus,
      toStatus: 'delivered',
      actorId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      note: `تم تسليم المخرج: ${title}`,
      createdAt: now,
    });

    addNotification(
      db,
      order.clientId,
      `تم تسليم مخرجات الطلب #${order.orderNumber}`,
      `رفع ${order.providerName} مخرج "${title}". يرجى المراجعة والاعتماد.`,
      'order',
      '/dashboard'
    );

    appendAudit(db, actor.userId, actor.role, 'SUBMIT_SERVICE_DELIVERABLE', 'service_order', order.id, `تسليم مخرج للطلب #${order.orderNumber}: ${title}`);
    saveCatalogDb(db);

    return res.status(201).json({ success: true, order, deliverable });
  });

  // ---------------------------------------------------------------------------
  // 6. REVIEWS (Verified completed buyers only), FAVORITES & NOTIFICATIONS
  // ---------------------------------------------------------------------------
  router.post('/services/:id/reviews', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor) return;

    const db = getCatalogDb();
    const service = db.services.find((s) => s.id === req.params.id && !s.deletedAt);
    if (!service) {
      return res.status(404).json({ success: false, error: 'الخدمة غير موجودة.' });
    }

    const rating = Number(req.body.rating);
    const comment = sanitizeText(req.body.comment || '');
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'التقييم يجب أن يكون من 1 إلى 5 نجوم.' });
    }
    if (!comment || comment.length < 5) {
      return res.status(400).json({ success: false, error: 'يرجى كتابة تعليق تقييم واضح.' });
    }

    const completedOrder = db.orders.find(
      (o) =>
        o.serviceId === service.id &&
        o.clientId === actor.userId &&
        o.status === 'completed' &&
        !db.reviews.some((r) => r.orderId === o.id)
    );

    if (!completedOrder && actor.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'التقييم متاح فقط للعملاء الذين أتموا شراء واستلام هذه الخدمة بنجاح.',
      });
    }

    const review = {
      id: `srev-${Date.now()}`,
      serviceId: service.id,
      orderId: completedOrder ? completedOrder.id : `adm-ord-${Date.now()}`,
      clientId: actor.userId,
      clientName: actor.name,
      rating,
      comment,
      verifiedPurchase: true,
      createdAt: new Date().toISOString(),
    };

    db.reviews.unshift(review);
    const srvReviews = db.reviews.filter((r) => r.serviceId === service.id);
    const avg = srvReviews.reduce((a, b) => a + b.rating, 0) / srvReviews.length;
    service.reviewCount = srvReviews.length;
    service.rating = Number(avg.toFixed(2));

    appendAudit(db, actor.userId, actor.role, 'CREATE_SERVICE_REVIEW', 'service', service.id, `تقييم ${rating}/5 للخدمة "${service.titleAr}"`);
    saveCatalogDb(db);

    return res.status(201).json({ success: true, review, service });
  });

  router.get('/service-favorites', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor) return;
    const db = getCatalogDb();
    res.json({ success: true, favoriteIds: db.favorites[actor.userId] || [] });
  });

  router.post('/services/:id/favorite', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor) return;

    const db = getCatalogDb();
    const service = db.services.find((s) => s.id === req.params.id && !s.deletedAt);
    if (!service) {
      return res.status(404).json({ success: false, error: 'الخدمة غير موجودة.' });
    }

    const current = db.favorites[actor.userId] || [];
    const exists = current.includes(service.id);
    db.favorites[actor.userId] = exists ? current.filter((id) => id !== service.id) : [...current, service.id];
    saveCatalogDb(db);

    return res.json({
      success: true,
      isFavorited: !exists,
      favoriteIds: db.favorites[actor.userId],
    });
  });

  router.get('/notifications', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor) return;

    const db = getCatalogDb();
    const list = db.notifications.filter((n) => n.userId === actor.userId);
    res.json({
      success: true,
      notifications: list,
      unreadCount: list.filter((n) => !n.isRead).length,
    });
  });

  router.patch('/notifications/:id/read', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor) return;

    const db = getCatalogDb();
    const notif = db.notifications.find((n) => n.id === req.params.id);
    if (!notif) return res.status(404).json({ success: false, error: 'الإشعار غير موجود.' });
    if (notif.userId !== actor.userId && actor.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'غير مصرح.' });
    }
    notif.isRead = true;
    saveCatalogDb(db);
    res.json({ success: true, notification: notif });
  });

  router.post('/notifications/read-all', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor) return;

    const db = getCatalogDb();
    db.notifications.forEach((n) => {
      if (n.userId === actor.userId) n.isRead = true;
    });
    saveCatalogDb(db);
    res.json({ success: true });
  });

  // ---------------------------------------------------------------------------
  // 7. SAFE FILE UPLOADS (Order Attachments & Deliverables)
  // ---------------------------------------------------------------------------
  router.post('/uploads', (req: Request, res: Response) => {
    const actor = requireAuth(req, res);
    if (!actor) return;

    const fileName = String(req.body.fileName || '').trim();
    const mimeType = String(req.body.mimeType || '').trim();
    const base64Content = String(req.body.base64Content || '').trim();

    if (!fileName || !base64Content) {
      return res.status(400).json({ success: false, error: 'بيانات الملف مطلوبة.' });
    }

    const cleanBase64 = base64Content.includes(',') ? base64Content.split(',')[1] : base64Content;
    const buffer = Buffer.from(cleanBase64, 'base64');

    const validation = validateAttachment({
      name: fileName,
      type: mimeType,
      size: buffer.length,
    });

    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const ext = path.extname(fileName).toLowerCase().replace(/[^a-z0-9.]/g, '') || '.bin';
    const storedName = `${Date.now()}-${Math.floor(Math.random() * 100000)}${ext}`;
    const uploadsDir = getUploadsDir();
    const targetPath = path.join(uploadsDir, storedName);

    fs.writeFileSync(targetPath, buffer);

    return res.status(201).json({
      success: true,
      file: {
        name: sanitizeText(path.basename(fileName)),
        mimeType: mimeType || 'application/octet-stream',
        sizeBytes: buffer.length,
        url: `/api/uploads/${storedName}`,
      },
    });
  });

  router.get('/uploads/:filename', (req: Request, res: Response) => {
    const safeName = path.basename(String(req.params.filename || ''));
    const uploadsDir = getUploadsDir();
    const fullPath = path.join(uploadsDir, safeName);

    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (fs.existsSync(fullPath)) {
      return res.sendFile(fullPath);
    }

    // Friendly fallback text for seeded sample attachments
    if (safeName.startsWith('sample-')) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send(`WASEET Sample Document (${safeName}) - Generated for order workspace demonstration.`);
    }

    return res.status(404).json({ success: false, error: 'الملف غير موجود.' });
  });

  return router;
}
