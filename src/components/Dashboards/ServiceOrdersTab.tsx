import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder, ServiceOrderStatus } from '../../types';
import { catalogFetch, fileToBase64 } from '../../utils/catalogApi';
import { SERVICE_ORDER_STATUS_LABELS, validateAttachment } from '../../utils/servicesCatalog';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck,
  Paperclip,
  RefreshCw,
  Send,
  Upload,
  XCircle,
} from 'lucide-react';

export const ServiceOrdersTab: React.FC<{ mode: 'client' | 'provider' | 'admin' }> = ({ mode }) => {
  const { currentUser, triggerCatalogRefresh, refreshNotifications, catalogRefreshTick, navigateToService } = useApp();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Deliverable submission form state
  const [deliveringOrderId, setDeliveringOrderId] = useState<string | null>(null);
  const [delivTitle, setDelivTitle] = useState('');
  const [delivNotes, setDelivNotes] = useState('');
  const [delivFileUrl, setDelivFileUrl] = useState<string | undefined>();
  const [delivFileName, setDelivFileName] = useState<string | undefined>();
  const [isUploadingDeliv, setIsUploadingDeliv] = useState(false);

  const loadOrders = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await catalogFetch<{ success: boolean; orders: ServiceOrder[] }>(
        '/api/service-orders',
        {},
        currentUser
      );
      setOrders(res.orders || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'تعذر تحميل طلبات الخدمات.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [currentUser.id, currentUser.role, catalogRefreshTick]);

  const handleStatusChange = async (orderId: string, nextStatus: ServiceOrderStatus, note?: string) => {
    setErrorMsg(null);
    setActionMsg(null);
    try {
      await catalogFetch(
        `/api/service-orders/${encodeURIComponent(orderId)}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: nextStatus, note }),
        },
        currentUser
      );
      setActionMsg(`تم تحديث حالة الطلب بنجاح.`);
      triggerCatalogRefresh();
      await refreshNotifications();
      await loadOrders();
    } catch (err: any) {
      setErrorMsg(err.message || 'تعذر تحديث حالة الطلب.');
    }
  };

  const handlePayOrder = async (orderId: string) => {
    setErrorMsg(null);
    setActionMsg(null);
    try {
      await catalogFetch(
        `/api/service-orders/${encodeURIComponent(orderId)}/pay`,
        {
          method: 'POST',
          headers: { 'Idempotency-Key': `IDEM-DASH-${orderId}` },
          body: JSON.stringify({ paymentMethod: 'card_online', idempotencyKey: `IDEM-DASH-${orderId}` }),
        },
        currentUser
      );
      setActionMsg('تم تأكيد سداد الطلب بنجاح (وضع المحاكاة المحلي).');
      triggerCatalogRefresh();
      await refreshNotifications();
      await loadOrders();
    } catch (err: any) {
      setErrorMsg(err.message || 'تعذر تأكيد الدفع.');
    }
  };

  const handleDeliverableUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateAttachment({ name: file.name, type: file.type, size: file.size });
    if (!validation.valid) {
      setErrorMsg(validation.error || 'ملف غير صالح');
      return;
    }
    setIsUploadingDeliv(true);
    try {
      const base64Content = await fileToBase64(file);
      const uploaded = await catalogFetch<{ success: boolean; file: { name: string; url: string } }>(
        '/api/uploads',
        {
          method: 'POST',
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            base64Content,
          }),
        },
        currentUser
      );
      setDelivFileName(uploaded.file.name);
      setDelivFileUrl(uploaded.file.url);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل رفع ملف المخرج');
    } finally {
      setIsUploadingDeliv(false);
    }
  };

  const handleSubmitDeliverable = async (e: React.FormEvent, orderId: string) => {
    e.preventDefault();
    if (!delivTitle.trim()) return;
    setErrorMsg(null);
    try {
      await catalogFetch(
        `/api/service-orders/${encodeURIComponent(orderId)}/deliverables`,
        {
          method: 'POST',
          body: JSON.stringify({
            title: delivTitle.trim(),
            notes: delivNotes.trim(),
            fileUrl: delivFileUrl,
            fileName: delivFileName,
          }),
        },
        currentUser
      );
      setDeliveringOrderId(null);
      setDelivTitle('');
      setDelivNotes('');
      setDelivFileUrl(undefined);
      setDelivFileName(undefined);
      setActionMsg('تم تسليم مخرج الخدمة وإخطار العميل للمراجعة.');
      triggerCatalogRefresh();
      await refreshNotifications();
      await loadOrders();
    } catch (err: any) {
      setErrorMsg(err.message || 'تعذر تسليم المخرج.');
    }
  };

  const filtered = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);

  return (
    <div className="space-y-5 text-right" data-testid="service-orders-tab">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">
            {mode === 'client'
              ? 'طلبات الخدمات الاستشارية الخاصة بي'
              : mode === 'provider'
              ? 'طلبات الخدمات الواردة وإدارة التنفيذ'
              : 'مراقبة جميع طلبات الخدمات والنزاعات'}
          </h3>
          <p className="text-xs text-slate-500">
            متابعة دورة حياة الطلب الكاملة واحتساب عمولة المنصة (15%) وصافي مستحقات مقدم الخدمة (85%).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-semibold cursor-pointer"
          >
            <option value="all">كل الحالات ({orders.length})</option>
            {Object.entries(SERVICE_ORDER_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.ar}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={loadOrders}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 cursor-pointer"
            title="تحديث"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
          {actionMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold">
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
          جاري تحميل طلبات الخدمات...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
          لا توجد طلبات خدمات مطابقة حالياً.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ord) => {
            const st = SERVICE_ORDER_STATUS_LABELS[ord.status] || SERVICE_ORDER_STATUS_LABELS.pending;
            return (
              <div
                key={ord.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
                data-testid={`service-order-card-${ord.orderNumber}`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
                        {ord.orderNumber}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${st.badgeClass}`}>
                        {st.ar}
                      </span>
                      {ord.packageName && (
                        <span className="text-[11px] text-slate-500 font-semibold">{ord.packageName}</span>
                      )}
                    </div>
                    <h4
                      onClick={() => navigateToService(ord.serviceId)}
                      className="text-sm font-extrabold text-slate-900 hover:text-blue-600 cursor-pointer"
                    >
                      {ord.serviceTitleAr}
                    </h4>
                    <p className="text-xs text-slate-500">
                      العميل: <strong className="text-slate-700">{ord.clientName}</strong> • مقدم الخدمة:{' '}
                      <strong className="text-slate-700">{ord.providerName}</strong> • المدة: {ord.executionDays} أيام
                    </p>
                  </div>

                  {/* Financials */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-0.5 shrink-0">
                    <div className="font-black text-slate-900">
                      الإجمالي: {ord.priceEgp.toLocaleString('ar-EG')} ج.م
                    </div>
                    <div className="text-[11px] text-slate-500">
                      عمولة وسيط (15%): {ord.platformFeeEgp.toLocaleString('ar-EG')} ج.م
                    </div>
                    <div className="text-[11px] font-bold text-emerald-700">
                      صافي المستشار (85%): {ord.netProviderEgp.toLocaleString('ar-EG')} ج.م
                    </div>
                  </div>
                </div>

                {/* Client Notes & Attachments */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2 text-xs">
                  <span className="font-bold text-slate-700 block">متطلبات العميل:</span>
                  <p className="text-slate-600 leading-relaxed">{ord.clientNotes}</p>

                  {ord.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {ord.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>{att.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Deliverables */}
                {ord.deliverables.length > 0 && (
                  <div className="bg-emerald-50/60 rounded-xl p-3.5 border border-emerald-200 space-y-2 text-xs">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4" />
                      المخرجات المسلمة ({ord.deliverables.length})
                    </span>
                    {ord.deliverables.map((del) => (
                      <div key={del.id} className="bg-white p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between gap-2">
                        <div>
                          <strong className="text-slate-900 block">{del.title}</strong>
                          {del.notes && <span className="text-[11px] text-slate-600">{del.notes}</span>}
                        </div>
                        {del.fileUrl && (
                          <a
                            href={del.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold shrink-0"
                          >
                            تحميل الملف
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Deliverable Upload Drawer (Provider) */}
                {deliveringOrderId === ord.id && (
                  <form
                    onSubmit={(e) => handleSubmitDeliverable(e, ord.id)}
                    className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 space-y-3 text-xs"
                  >
                    <h5 className="font-bold text-blue-900">تسليم المخرج النهائي للطلب</h5>
                    <input
                      type="text"
                      value={delivTitle}
                      onChange={(e) => setDelivTitle(e.target.value)}
                      placeholder="عنوان المخرج (مثال: تقرير الفحص الضريبي النهائي)"
                      className="w-full p-2.5 bg-white border border-blue-200 rounded-xl"
                      required
                    />
                    <textarea
                      rows={2}
                      value={delivNotes}
                      onChange={(e) => setDelivNotes(e.target.value)}
                      placeholder="ملخص ما تم إنجازه وتوصيات المتابعة..."
                      className="w-full p-2.5 bg-white border border-blue-200 rounded-xl"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-blue-200 rounded-xl cursor-pointer font-semibold text-blue-700">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingDeliv ? 'جاري الرفع...' : delivFileName || 'إرفاق ملف المخرج'}</span>
                        <input type="file" onChange={handleDeliverableUpload} className="hidden" />
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDeliveringOrderId(null)}
                          className="px-3 py-2 text-slate-600 cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال المخرج</span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Role-Based Action Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    آخر تحديث: {new Date(ord.updatedAt).toLocaleString('ar-EG')}
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* CLIENT ACTIONS */}
                    {mode === 'client' && ['pending', 'accepted', 'awaiting_payment'].includes(ord.status) && (
                      <>
                        <button
                          type="button"
                          onClick={() => handlePayOrder(ord.id)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>تأكيد السداد الآن</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ord.id, 'cancelled', 'إلغاء الطلب بواسطة العميل')}
                          className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl font-semibold cursor-pointer"
                        >
                          إلغاء الطلب
                        </button>
                      </>
                    )}

                    {mode === 'client' && ord.status === 'delivered' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ord.id, 'completed', 'اعتماد استلام المخرجات واكتمال الخدمة')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>اعتماد الاستلام وإكمال الطلب</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ord.id, 'in_progress', 'طلب تعديل على المخرجات المسلمة')}
                          className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl font-bold cursor-pointer"
                        >
                          طلب تعديل
                        </button>
                      </>
                    )}

                    {/* PROVIDER ACTIONS */}
                    {mode === 'provider' && ord.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ord.id, 'accepted', 'قبول الطلب من المستشار وبانتظار السداد')}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                        >
                          قبول الطلب
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ord.id, 'cancelled', 'اعتذار مقدم الخدمة عن الطلب')}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-semibold cursor-pointer"
                        >
                          رفض الطلب
                        </button>
                      </>
                    )}

                    {mode === 'provider' && ord.status === 'paid' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(ord.id, 'in_progress', 'بدء تنفيذ الخدمة الاستشارية')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                      >
                        بدء التنفيذ
                      </button>
                    )}

                    {mode === 'provider' && ['paid', 'in_progress'].includes(ord.status) && (
                      <button
                        type="button"
                        onClick={() => setDeliveringOrderId(ord.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>تسليم المخرجات</span>
                      </button>
                    )}

                    {/* DISPUTE BUTTON FOR PAID/IN_PROGRESS/DELIVERED */}
                    {['paid', 'in_progress', 'delivered'].includes(ord.status) && mode !== 'admin' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(ord.id, 'disputed', 'فتح نزاع للمراجعة من إدارة المنصة')}
                        className="px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>فتح نزاع</span>
                      </button>
                    )}

                    {/* ADMIN DISPUTE SETTLEMENT */}
                    {mode === 'admin' && ord.status === 'disputed' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ord.id, 'refunded', 'تسوية إدارية: استرداد للعميل')}
                          className="px-3 py-2 bg-rose-600 text-white rounded-xl font-bold cursor-pointer"
                        >
                          استرداد للعميل
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ord.id, 'completed', 'تسوية إدارية: إكمال وصرف للمستشار')}
                          className="px-3 py-2 bg-emerald-600 text-white rounded-xl font-bold cursor-pointer"
                        >
                          اعتماد وصرف للمستشار
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
