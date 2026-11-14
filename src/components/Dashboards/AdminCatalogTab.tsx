import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CatalogService,
  ServiceApprovalRecord,
  ServiceCategoryNode,
} from '../../types';
import { catalogFetch } from '../../utils/catalogApi';
import {
  Award,
  BarChart3,
  CheckCircle2,
  FolderPlus,
  Layers,
  ShieldAlert,
  XCircle,
} from 'lucide-react';

interface ReportSummary {
  totalServices: number;
  publishedServices: number;
  pendingReviewServices: number;
  totalOrders: number;
  activeOrCompletedOrders: number;
  disputedOrders: number;
  totalSalesPiasters: number;
  totalSalesEgp: number;
  totalCommissionPiasters: number;
  totalCommissionEgp: number;
  totalNetProvidersPiasters: number;
  totalNetProvidersEgp: number;
}

export const AdminCatalogTab: React.FC = () => {
  const { currentUser, navigateToService, triggerCatalogRefresh, catalogRefreshTick } = useApp();
  const [subTab, setSubTab] = useState<'services' | 'categories' | 'reports'>('services');

  const [services, setServices] = useState<CatalogService[]>([]);
  const [approvals, setApprovals] = useState<ServiceApprovalRecord[]>([]);
  const [categories, setCategories] = useState<ServiceCategoryNode[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [reasonByService, setReasonByService] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Add Category / Subcategory form
  const [newCatNameAr, setNewCatNameAr] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatParentId, setNewCatParentId] = useState('');
  const [newCatRequiresLicense, setNewCatRequiresLicense] = useState(false);

  const loadAll = async () => {
    try {
      const [srvRes, catRes, repRes] = await Promise.all([
        catalogFetch<{ success: boolean; services: CatalogService[]; approvals: ServiceApprovalRecord[] }>(
          '/api/admin/services',
          {},
          currentUser
        ),
        catalogFetch<{ success: boolean; categories: ServiceCategoryNode[] }>(
          '/api/admin/service-categories',
          {},
          currentUser
        ),
        catalogFetch<{ success: boolean; summary: ReportSummary; auditLogs: any[] }>(
          '/api/admin/catalog-reports',
          {},
          currentUser
        ),
      ]);
      setServices(srvRes.services || []);
      setApprovals(srvRes.approvals || []);
      setCategories(catRes.categories || []);
      setSummary(repRes.summary || null);
      setAuditLogs(repRes.auditLogs || []);
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'تعذر تحميل بيانات إدارة الكتالوج.' });
    }
  };

  useEffect(() => {
    loadAll();
  }, [currentUser.id, catalogRefreshTick]);

  const handleReview = async (
    serviceId: string,
    decision: 'approve' | 'reject' | 'suspend' | 'feature' | 'unfeature'
  ) => {
    setFeedback(null);
    const reason = reasonByService[serviceId] || '';
    try {
      await catalogFetch(
        `/api/admin/services/${encodeURIComponent(serviceId)}/review`,
        {
          method: 'PATCH',
          body: JSON.stringify({ decision, reason }),
        },
        currentUser
      );
      setFeedback({ type: 'ok', text: `تم تنفيذ قرار الإدارة (${decision}) بنجاح.` });
      triggerCatalogRefresh();
      await loadAll();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'تعذر تنفيذ القرار.' });
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await catalogFetch(
        '/api/admin/service-categories',
        {
          method: 'POST',
          body: JSON.stringify({
            nameAr: newCatNameAr.trim(),
            nameEn: newCatNameEn.trim() || newCatNameAr.trim(),
            parentId: newCatParentId || null,
            requiresLicense: newCatRequiresLicense,
          }),
        },
        currentUser
      );
      setNewCatNameAr('');
      setNewCatNameEn('');
      setNewCatParentId('');
      setNewCatRequiresLicense(false);
      setFeedback({ type: 'ok', text: 'تمت إضافة التصنيف بنجاح وتحديث الكتالوج.' });
      triggerCatalogRefresh();
      await loadAll();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'تعذر إضافة التصنيف.' });
    }
  };

  const handleToggleCategoryActive = async (cat: ServiceCategoryNode) => {
    try {
      await catalogFetch(
        `/api/admin/service-categories/${encodeURIComponent(cat.id)}`,
        { method: 'PATCH', body: JSON.stringify({ isActive: !cat.isActive }) },
        currentUser
      );
      triggerCatalogRefresh();
      await loadAll();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message });
    }
  };

  const pendingServices = services.filter((s) => s.status === 'pending_review');

  return (
    <div className="space-y-6 text-right" data-testid="admin-catalog-tab">
      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">إدارة كتالوج الخدمات الاستشارية والتصنيفات</h3>
          <p className="text-xs text-slate-500">
            مراجعة واعتماد الخدمات الجديدة، إدارة التصنيفات الـ18 والفرعية، ومراقبة العمولات (15%).
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { id: 'services', label: `مراجعة الخدمات (${services.length})`, badge: pendingServices.length },
            { id: 'categories', label: `التصنيفات والفرعية (${categories.length})` },
            { id: 'reports', label: 'تقارير المبيعات والعمولات والتدقيق' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id as any)}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer ${
                subTab === t.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{t.label}</span>
              {t.badge ? (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                  {t.badge} بانتظار
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* SUBTAB 1: SERVICES APPROVAL & GOVERNANCE */}
      {subTab === 'services' && (
        <div className="space-y-4">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
              data-testid={`admin-service-row-${srv.id}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <img
                    src={srv.imageUrl}
                    alt={srv.titleAr}
                    className="w-20 h-16 rounded-xl object-cover shrink-0 bg-slate-100 border border-slate-200"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="font-bold text-blue-700">{srv.categoryNameAr}</span>
                      <span>•</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full ${
                          srv.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700'
                            : srv.status === 'pending_review'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {srv.status === 'published'
                          ? 'منشورة'
                          : srv.status === 'pending_review'
                          ? 'بانتظار الاعتماد'
                          : srv.status === 'rejected'
                          ? 'مرفوضة'
                          : srv.status === 'suspended'
                          ? 'موقوفة إدارياً'
                          : srv.status === 'paused'
                          ? 'متوقفة مؤقتاً'
                          : 'مسودة'}
                      </span>
                      {srv.isFeatured && (
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                          خدمة مميزة
                        </span>
                      )}
                    </div>
                    <h4
                      onClick={() => navigateToService(srv.id)}
                      className="text-sm font-extrabold text-slate-900 hover:text-blue-600 cursor-pointer mt-1"
                    >
                      {srv.titleAr}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      مقدم الخدمة: <strong>{srv.providerName}</strong> • السعر:{' '}
                      <strong>{srv.priceEgp.toLocaleString('ar-EG')} ج.م</strong> ({srv.pricePiasters.toLocaleString()} قرش)
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
                  {srv.status !== 'published' && (
                    <button
                      type="button"
                      onClick={() => handleReview(srv.id, 'approve')}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                      data-testid={`approve-srv-${srv.id}`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>اعتماد ونشر</span>
                    </button>
                  )}

                  {srv.status === 'published' && (
                    <button
                      type="button"
                      onClick={() => handleReview(srv.id, srv.isFeatured ? 'unfeature' : 'feature')}
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>{srv.isFeatured ? 'إلغاء التمييز' : 'تمييز'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleReview(srv.id, 'reject')}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>رفض</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReview(srv.id, 'suspend')}
                    className="px-3 py-2 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>إيقاف مخالفة</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  value={reasonByService[srv.id] || ''}
                  onChange={(e) =>
                    setReasonByService((prev) => ({ ...prev, [srv.id]: e.target.value }))
                  }
                  placeholder="سبب القرار أو ملاحظة للمستشار (إلزامي عند الرفض أو الإيقاف)..."
                  className="flex-1 text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 2: CATEGORIES & SUBCATEGORIES MANAGEMENT */}
      {subTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateCategory}
            className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 h-fit"
          >
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4 text-blue-600" />
              <span>إضافة تصنيف رئيسي أو فرعي جديد</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم التصنيف بالعربية *</label>
                <input
                  type="text"
                  value={newCatNameAr}
                  onChange={(e) => setNewCatNameAr(e.target.value)}
                  placeholder="مثال: الاستشارات البيئية والاستدامة"
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">الاسم بالإنجليزية</label>
                <input
                  type="text"
                  value={newCatNameEn}
                  onChange={(e) => setNewCatNameEn(e.target.value)}
                  placeholder="ESG & Sustainability Advisory"
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">تصنيف أب (اختياري لإنشاء تصنيف فرعي)</label>
                <select
                  value={newCatParentId}
                  onChange={(e) => setNewCatParentId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50"
                >
                  <option value="">— إنشاء كتصنيف رئيسي مستقل —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      فرعي تحت: {c.nameAr}
                    </option>
                  ))}
                </select>
              </div>
              {!newCatParentId && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCatRequiresLicense}
                    onChange={(e) => setNewCatRequiresLicense(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-semibold text-slate-700">يتطلب ترخيصاً مهنياً موثقاً من المستشار</span>
                </label>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
              >
                حفظ وإضافة للكتالوج
              </button>
            </div>
          </form>

          <div className="lg:col-span-8 space-y-3">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <h5 className="text-sm font-bold text-slate-900">{cat.nameAr}</h5>
                      <span className="text-[11px] text-slate-400 font-mono">{cat.nameEn}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(cat.subcategories || []).map((sc) => (
                        <span
                          key={sc.id}
                          className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg font-medium"
                        >
                          {sc.nameAr}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleCategoryActive(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      cat.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {cat.isActive ? 'نشط' : 'معطل'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: REPORTS & AUDIT LOGS */}
      {subTab === 'reports' && summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 block">إجمالي مبيعات الكتالوج</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {summary.totalSalesEgp.toLocaleString('ar-EG')} ج.م
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {summary.totalSalesPiasters.toLocaleString()} قرش
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 block">عمولة المنصة المحققة (15%)</span>
              <span className="text-xl font-black text-blue-700 mt-1 block">
                {summary.totalCommissionEgp.toLocaleString('ar-EG')} ج.م
              </span>
              <span className="text-[10px] text-blue-600 font-mono">
                {summary.totalCommissionPiasters.toLocaleString()} قرش
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 block">صافي مستحقات المستشارين (85%)</span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">
                {summary.totalNetProvidersEgp.toLocaleString('ar-EG')} ج.م
              </span>
              <span className="text-[10px] text-emerald-600 font-mono">
                {summary.totalNetProvidersPiasters.toLocaleString()} قرش
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 block">الخدمات والطلبات</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {summary.publishedServices} منشورة / {summary.totalOrders} طلب
              </span>
              <span className="text-[10px] text-amber-700 font-bold">
                {summary.pendingReviewServices} بانتظار المراجعة • {summary.disputedOrders} نزاع
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
            <div className="p-4 border-b border-slate-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-900">سجل تدقيق عمليات الكتالوج والطلبات</h4>
            </div>
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">العملية</th>
                  <th className="py-2.5 px-4">الدور</th>
                  <th className="py-2.5 px-4">التفاصيل</th>
                  <th className="py-2.5 px-4">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2 px-4 font-mono font-bold text-blue-700">{log.action}</td>
                    <td className="py-2 px-4">{log.actorRole}</td>
                    <td className="py-2 px-4 text-slate-700">{log.details}</td>
                    <td className="py-2 px-4 text-slate-400">
                      {new Date(log.createdAt).toLocaleString('ar-EG')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
