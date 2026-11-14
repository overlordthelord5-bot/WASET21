import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateServiceCommissionPiasters,
  canTransitionOrderStatus,
  filterAndSortCatalogServices,
  isServicePubliclyVisible,
  sanitizeText,
  validateAttachment,
} from './servicesCatalog';
import { CatalogService } from '../types';

const makeService = (overrides: Partial<CatalogService> = {}): CatalogService => ({
  id: 'srv-test-1',
  slug: 'test-service',
  consultantId: 'consultant-1',
  providerUserId: 'user-consultant-1',
  providerName: 'د. طارق السعيد العوضي',
  providerTitle: 'مستشار ضرائب',
  providerAvatar: '/src/assets/images/service_tax_finance_1794569785276.jpg',
  providerVerified: true,
  categoryId: 'cat-taxes',
  categoryNameAr: 'الضرائب والاستشارات المالية',
  categoryNameEn: 'Tax & Financial Advisory',
  subcategoryId: 'sub-vat',
  subcategoryNameAr: 'ضريبة القيمة المضافة',
  subcategoryNameEn: 'VAT Compliance',
  titleAr: 'فحص ضريبي متكامل للشركات',
  titleEn: 'Corporate Tax Audit',
  shortDescriptionAr: 'مراجعة الإقرارات الضريبية والفاتورة الإلكترونية.',
  shortDescriptionEn: 'Tax return and e-invoice review.',
  fullDescriptionAr: 'تفاصيل كاملة للفحص الضريبي.',
  fullDescriptionEn: 'Full tax audit details.',
  imageUrl: '/src/assets/images/service_tax_finance_1794569785276.jpg',
  priceEgp: 1800,
  pricePiasters: 180000,
  executionDays: 3,
  deliveryMode: 'online',
  revisionsCount: 2,
  includedAr: ['تقرير ضريبي'],
  excludedAr: ['الرسوم الحكومية'],
  prerequisitesAr: ['البطاقة الضريبية'],
  deliverablesAr: ['ملف PDF'],
  milestones: [],
  faqs: [],
  tags: ['ضرائب', 'مصر'],
  requiresLicense: true,
  isFeatured: true,
  isRecommended: true,
  isDemo: true,
  status: 'published',
  rating: 4.9,
  reviewCount: 18,
  ordersCount: 12,
  createdAt: '2026-03-01T10:00:00Z',
  updatedAt: '2026-03-01T10:00:00Z',
  deletedAt: null,
  ...overrides,
});

test('calculateServiceCommissionPiasters computes exact 15% fee in integer piasters', () => {
  const res = calculateServiceCommissionPiasters(1999.99, 15);
  assert.equal(res.totalPiasters, 199999);
  assert.equal(res.feePiasters + res.netProviderPiasters, res.totalPiasters);
  assert.equal(res.feePiasters, Math.round((199999 * 15) / 100));

  const even = calculateServiceCommissionPiasters(2000, 15);
  assert.equal(even.totalPiasters, 200000);
  assert.equal(even.feePiasters, 30000);
  assert.equal(even.netProviderPiasters, 170000);
  assert.equal(even.feeEgp, 300);
  assert.equal(even.netProviderEgp, 1700);
});

test('isServicePubliclyVisible enforces licensing gate for unverified consultants', () => {
  const licensed = makeService({ requiresLicense: true, status: 'published' });
  assert.equal(isServicePubliclyVisible(licensed, 'verified'), true);
  assert.equal(isServicePubliclyVisible(licensed, 'pending'), false);
  assert.equal(isServicePubliclyVisible(licensed, 'rejected'), false);

  const pendingReview = makeService({ requiresLicense: false, status: 'pending_review' });
  assert.equal(isServicePubliclyVisible(pendingReview, 'verified'), false);
});

test('filterAndSortCatalogServices filters, sorts, and paginates accurately', () => {
  const s1 = makeService({ id: 's1', priceEgp: 2500, ordersCount: 5, rating: 4.7, deliveryMode: 'online' });
  const s2 = makeService({ id: 's2', priceEgp: 1200, ordersCount: 25, rating: 4.95, deliveryMode: 'in_person', categoryId: 'cat-legal' });
  const s3 = makeService({ id: 's3', priceEgp: 4000, ordersCount: 15, rating: 4.8, deliveryMode: 'both', providerVerified: false, requiresLicense: true });

  const allRes = filterAndSortCatalogServices([s1, s2, s3], { sort: 'most_requested', page: 1, pageSize: 10 });
  assert.equal(allRes.total, 2); // s3 hidden because unverified & requiresLicense
  assert.equal(allRes.items[0].id, 's2');

  const legalOnly = filterAndSortCatalogServices([s1, s2, s3], { categoryId: 'cat-legal' });
  assert.equal(legalOnly.total, 1);
  assert.equal(legalOnly.items[0].id, 's2');

  const onlineOnly = filterAndSortCatalogServices([s1, s2, s3], { deliveryMode: 'online' });
  assert.equal(onlineOnly.total, 1);
  assert.equal(onlineOnly.items[0].id, 's1');
});

test('canTransitionOrderStatus validates 10-status workflow & role boundaries', () => {
  assert.equal(canTransitionOrderStatus('pending', 'accepted', 'consultant').allowed, true);
  assert.equal(canTransitionOrderStatus('pending', 'accepted', 'client').allowed, false);
  assert.equal(canTransitionOrderStatus('accepted', 'paid', 'client').allowed, true);
  assert.equal(canTransitionOrderStatus('paid', 'in_progress', 'consultant').allowed, true);
  assert.equal(canTransitionOrderStatus('in_progress', 'delivered', 'consultant').allowed, true);
  assert.equal(canTransitionOrderStatus('delivered', 'completed', 'client').allowed, true);
  assert.equal(canTransitionOrderStatus('completed', 'cancelled', 'client').allowed, false);
  assert.equal(canTransitionOrderStatus('disputed', 'refunded', 'admin').allowed, true);
  assert.equal(canTransitionOrderStatus('disputed', 'refunded', 'consultant').allowed, false);
});

test('validateAttachment and sanitizeText reject dangerous input', () => {
  assert.equal(validateAttachment({ name: 'contract.pdf', type: 'application/pdf', size: 1024 }).valid, true);
  assert.equal(validateAttachment({ name: 'malware.exe', type: 'application/octet-stream', size: 1024 }).valid, false);
  assert.equal(validateAttachment({ name: 'huge.pdf', type: 'application/pdf', size: 6 * 1024 * 1024 }).valid, false);

  const clean = sanitizeText('<script>alert(1)</script><b>استشارة</b> ضريبية');
  assert.equal(clean, 'استشارة ضريبية');
});
