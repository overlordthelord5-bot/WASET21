import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CatalogDeliveryMode,
  CatalogService,
  ServiceCategoryNode,
} from '../../types';
import { catalogFetch } from '../../utils/catalogApi';
import {
  CheckCircle2,
  Edit3,
  Eye,
  PauseCircle,
  PlayCircle,
  PlusCircle,
  Trash2,
  X,
} from 'lucide-react';

const PRESET_STUDIO_IMAGES = [
  { label: 'محاسبة وضرائب ومالية', url: '/src/assets/images/service_tax_finance_1794569785276.jpg' },
  { label: 'قانون وتأسيس شركات', url: '/src/assets/images/service_legal_incorporation_1794569787053.jpg' },
  { label: 'برمجة وذكاء اصطناعي', url: '/src/assets/images/service_ai_software_1794569786325.jpg' },
  { label: 'تسويق وتجارة إلكترونية', url: '/src/assets/images/service_marketing_ecommerce_1794569787138.jpg' },
  { label: 'جدوى واستثمار وعقارات', url: '/src/assets/images/service_feasibility_realestate_1794569787205.jpg' },
];

export const ProviderServicesTab: React.FC = () => {
  const { currentUser, navigateToService, triggerCatalogRefresh, catalogRefreshTick } = useApp();
  const [services, setServices] = useState<CatalogService[]>([]);
  const [categories, setCategories] = useState<ServiceCategoryNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Create / Edit modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const [titleAr, setTitleAr] = useState('');
  const [shortDescriptionAr, setShortDescriptionAr] = useState('');
  const [fullDescriptionAr, setFullDescriptionAr] = useState('');
  const [categoryId, setCategoryId] = useState('scat-taxes');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [priceEgp, setPriceEgp] = useState(2000);
  const [executionDays, setExecutionDays] = useState(3);
  const [deliveryMode, setDeliveryMode] = useState<CatalogDeliveryMode>('online');
  const [revisionsCount, setRevisionsCount] = useState(2);
  const [imageUrl, setImageUrl] = useState(PRESET_STUDIO_IMAGES[0].url);
  const [includedText, setIncludedText] = useState('تقرير فني مكتوب\nجلسة مراجعة أونلاين 45 دقيقة');
  const [excludedText, setExcludedText] = useState('الرسوم الحكومية أو الضرائب المستحقة');
  const [prerequisitesText, setPrerequisitesText] = useState('نبذة عن النشاط والمستندات ذات الصلة');
  const [deliverablesText, setDeliverablesText] = useState('ملف التقرير النهائي بصيغة PDF');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [srvRes, catRes] = await Promise.all([
        catalogFetch<{ success: boolean; services: CatalogService[] }>('/api/provider/services', {}, currentUser),
        catalogFetch<{ success: boolean; categories: ServiceCategoryNode[] }>('/api/service-categories', {}, currentUser),
      ]);
      setServices(srvRes.services || []);
      setCategories(catRes.categories || []);
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'تعذر تحميل خدماتك.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.id, catalogRefreshTick]);

  const activeCategory = categories.find((c) => c.id === categoryId) || categories[0];

  const openCreateForm = () => {
    setEditingServiceId(null);
    setTitleAr('');
    setShortDescriptionAr('');
    setFullDescriptionAr('');
    setCategoryId(categories[0]?.id || 'scat-taxes');
    setSubcategoryId(categories[0]?.subcategories?.[0]?.id || '');
    setPriceEgp(2000);
    setExecutionDays(3);
    setDeliveryMode('online');
    setRevisionsCount(2);
    setImageUrl(PRESET_STUDIO_IMAGES[0].url);
    setIsFormOpen(true);
  };

  const openEditForm = (srv: CatalogService) => {
    setEditingServiceId(srv.id);
    setTitleAr(srv.titleAr);
    setShortDescriptionAr(srv.shortDescriptionAr);
    setFullDescriptionAr(srv.fullDescriptionAr);
    setCategoryId(srv.categoryId);
    setSubcategoryId(srv.subcategoryId);
    setPriceEgp(srv.priceEgp);
    setExecutionDays(srv.executionDays);
    setDeliveryMode(srv.deliveryMode);
    setRevisionsCount(srv.revisionsCount);
    setImageUrl(srv.imageUrl);
    setIncludedText(srv.includedAr.join('\n'));
    setExcludedText(srv.excludedAr.join('\n'));
    setPrerequisitesText(srv.prerequisitesAr.join('\n'));
    setDeliverablesText(srv.deliverablesAr.join('\n'));
    setIsFormOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const toLines = (txt: string) =>
      txt
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean);

    try {
      if (editingServiceId) {
        await catalogFetch(
          `/api/provider/services/${encodeURIComponent(editingServiceId)}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              titleAr,
              shortDescriptionAr,
              fullDescriptionAr: fullDescriptionAr || shortDescriptionAr,
              priceEgp,
              executionDays,
              deliveryMode,
            }),
          },
          currentUser
        );
        setFeedback({ type: 'ok', text: 'تم تحديث بيانات الخدمة بنجاح.' });
      } else {
        await catalogFetch(
          '/api/provider/services',
          {
            method: 'POST',
            body: JSON.stringify({
              titleAr,
              shortDescriptionAr,
              fullDescriptionAr: fullDescriptionAr || shortDescriptionAr,
              categoryId,
              subcategoryId: subcategoryId || activeCategory?.subcategories?.[0]?.id,
              priceEgp,
              executionDays,
              deliveryMode,
              revisionsCount,
              imageUrl,
              includedAr: toLines(includedText),
              excludedAr: toLines(excludedText),
              prerequisitesAr: toLines(prerequisitesText),
              deliverablesAr: toLines(deliverablesText),
            }),
          },
          currentUser
        );
        setFeedback({
          type: 'ok',
          text: 'تم إرسال الخدمة الجديدة بنجاح وهي الآن قيد المراجعة من الإدارة (Pending Review) قبل النشر.',
        });
      }
      setIsFormOpen(false);
      triggerCatalogRefresh();
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'تعذر حفظ الخدمة.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePause = async (srv: CatalogService) => {
    const targetStatus = srv.status === 'paused' ? 'published' : 'paused';
    try {
      await catalogFetch(
        `/api/provider/services/${encodeURIComponent(srv.id)}`,
        { method: 'PATCH', body: JSON.stringify({ status: targetStatus }) },
        currentUser
      );
      triggerCatalogRefresh();
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await catalogFetch(`/api/provider/services/${encodeURIComponent(id)}`, { method: 'DELETE' }, currentUser);
      setFeedback({ type: 'ok', text: 'تم حذف الخدمة من الكتالوج.' });
      triggerCatalogRefresh();
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message });
    }
  };

  const statusBadge = (status: CatalogService['status']) => {
    const map: Record<string, string> = {
      published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      pending_review: 'bg-amber-50 text-amber-800 border-amber-200',
      paused: 'bg-slate-100 text-slate-600 border-slate-200',
      rejected: 'bg-rose-50 text-rose-700 border-rose-200',
      suspended: 'bg-rose-100 text-rose-800 border-rose-300',
      draft: 'bg-slate-100 text-slate-600 border-slate-200',
    };
    const labelMap: Record<string, string> = {
      published: 'منشورة ومعتمدة',
      pending_review: 'بانتظار مراجعة الإدارة',
      paused: 'متوقفة مؤقتاً',
      rejected: 'مرفوضة',
      suspended: 'موقوفة إدارياً',
      draft: 'مسودة',
    };
    return (
      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${map[status] || map.draft}`}>
        {labelMap[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-5 text-right" data-testid="provider-services-tab">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">
            إدارة خدماتي في الكتالوج ({services.length})
          </h3>
          <p className="text-xs text-slate-500">
            أنشئ خدمات استشارية محددة السعر والمدة. تمر الخدمات الجديدة بمراجعة الإدارة قبل النشر للعملاء.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          data-testid="provider-add-service-btn"
        >
          <PlusCircle className="w-4 h-4" />
          <span>إضافة خدمة استشارية جديدة</span>
        </button>
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

      {isLoading ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
          جاري تحميل خدماتك...
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
          لم تقم بإضافة خدمات للكتالوج بعد. اضغط على "إضافة خدمة استشارية جديدة" للبدء.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((srv) => (
            <div key={srv.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-start gap-3">
                <img
                  src={srv.imageUrl}
                  alt={srv.titleAr}
                  className="w-20 h-16 rounded-xl object-cover shrink-0 bg-slate-100 border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-blue-700 font-bold">{srv.categoryNameAr}</span>
                    {statusBadge(srv.status)}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">{srv.titleAr}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    السعر: <strong className="text-slate-800">{srv.priceEgp.toLocaleString('ar-EG')} ج.م</strong> • التنفيذ:{' '}
                    {srv.executionDays} أيام • الطلبات: {srv.ordersCount}
                  </p>
                </div>
              </div>

              {srv.rejectionReason && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 font-semibold">
                  ملاحظة الإدارة: {srv.rejectionReason}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => navigateToService(srv.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>معاينة</span>
                </button>
                <button
                  type="button"
                  onClick={() => openEditForm(srv)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تعديل</span>
                </button>
                {(srv.status === 'published' || srv.status === 'paused') && (
                  <button
                    type="button"
                    onClick={() => handleTogglePause(srv)}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {srv.status === 'paused' ? (
                      <>
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>استئناف</span>
                      </>
                    ) : (
                      <>
                        <PauseCircle className="w-3.5 h-3.5" />
                        <span>إيقاف مؤقت</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(srv.id)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Service Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h4 className="text-base font-extrabold text-slate-900">
                {editingServiceId ? 'تعديل الخدمة الاستشارية' : 'إضافة خدمة استشارية جديدة'}
              </h4>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 max-h-[75vh] overflow-y-auto px-1 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم الخدمة الاستشارية *</label>
                <input
                  type="text"
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder="مثال: مراجعة الإقرارات الضريبية السنوية للشركات"
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              {!editingServiceId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">التصنيف الرئيسي *</label>
                    <select
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(e.target.value);
                        const found = categories.find((c) => c.id === e.target.value);
                        setSubcategoryId(found?.subcategories?.[0]?.id || '');
                      }}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">التصنيف الفرعي</label>
                    <select
                      value={subcategoryId}
                      onChange={(e) => setSubcategoryId(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50"
                    >
                      {(activeCategory?.subcategories || []).map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">الوصف المختصر للخدمة *</label>
                <input
                  type="text"
                  value={shortDescriptionAr}
                  onChange={(e) => setShortDescriptionAr(e.target.value)}
                  placeholder="سطر أو سطرين يوضحان القيمة والمخرجات الرئيسية"
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">الوصف الكامل ونطاق العمل</label>
                <textarea
                  rows={3}
                  value={fullDescriptionAr}
                  onChange={(e) => setFullDescriptionAr(e.target.value)}
                  placeholder="اشرح تفاصيل الخدمة وآلية التنفيذ..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">السعر (ج.م) *</label>
                  <input
                    type="number"
                    min={50}
                    value={priceEgp}
                    onChange={(e) => setPriceEgp(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">مدة التنفيذ (أيام) *</label>
                  <input
                    type="number"
                    min={1}
                    value={executionDays}
                    onChange={(e) => setExecutionDays(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">طريقة التقديم</label>
                  <select
                    value={deliveryMode}
                    onChange={(e) => setDeliveryMode(e.target.value as CatalogDeliveryMode)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50"
                  >
                    <option value="online">أونلاين عن بُعد</option>
                    <option value="in_person">حضوري</option>
                    <option value="both">أونلاين أو حضوري</option>
                  </select>
                </div>
              </div>

              {!editingServiceId && (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">صورة غلاف الخدمة</label>
                    <select
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50"
                    >
                      {PRESET_STUDIO_IMAGES.map((img) => (
                        <option key={img.url} value={img.url}>
                          {img.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">ما تشمله الخدمة (سطر لكل بند)</label>
                      <textarea
                        rows={3}
                        value={includedText}
                        onChange={(e) => setIncludedText(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">المخرجات النهائية (سطر لكل مخرج)</label>
                      <textarea
                        rows={3}
                        value={deliverablesText}
                        onChange={(e) => setDeliverablesText(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-slate-600 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? 'جاري الحفظ...' : editingServiceId ? 'حفظ التعديلات' : 'إرسال للمراجعة والنشر'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
