import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CatalogDeliveryMode,
  ServiceOrder,
  ServiceOrderAttachment,
} from '../types';
import {
  calculateServiceCommissionPiasters,
  SERVICE_PLATFORM_FEE_PERCENT,
  validateAttachment,
} from '../utils/servicesCatalog';
import { catalogFetch, fileToBase64 } from '../utils/catalogApi';
import {
  CheckCircle2,
  CreditCard,
  FileText,
  Info,
  Paperclip,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

export const ServiceOrderModal: React.FC = () => {
  const {
    currentUser,
    serviceOrderModalService,
    setServiceOrderModalService,
    setActiveView,
    triggerCatalogRefresh,
    refreshNotifications,
    setIsAuthModalOpen,
    setAuthMode,
  } = useApp();

  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [deliveryMode, setDeliveryMode] = useState<CatalogDeliveryMode>('online');
  const [clientNotes, setClientNotes] = useState('');
  const [attachments, setAttachments] = useState<ServiceOrderAttachment[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<ServiceOrder | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'card_online' | 'meeza' | 'fawry' | 'vodafone_cash'>('card_online');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentDoneOrder, setPaymentDoneOrder] = useState<ServiceOrder | null>(null);

  if (!serviceOrderModalService) return null;

  const service = serviceOrderModalService;
  const selectedPackage =
    selectedPackageId && service.packages
      ? service.packages.find((p) => p.id === selectedPackageId)
      : undefined;
  const activePriceEgp = selectedPackage ? selectedPackage.priceEgp : service.priceEgp;
  const activeDays = selectedPackage ? selectedPackage.executionDays : service.executionDays;
  const breakdown = calculateServiceCommissionPiasters(activePriceEgp, SERVICE_PLATFORM_FEE_PERCENT);

  const resetAndClose = () => {
    setServiceOrderModalService(null);
    setSelectedPackageId('');
    setClientNotes('');
    setAttachments([]);
    setUploadError(null);
    setSubmitError(null);
    setCreatedOrder(null);
    setPaymentDoneOrder(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        const validation = validateAttachment({ name: file.name, type: file.type, size: file.size });
        if (!validation.valid) {
          setUploadError(validation.error || 'ملف غير صالح');
          continue;
        }
        const base64Content = await fileToBase64(file);
        const uploaded = await catalogFetch<{
          success: boolean;
          file: { name: string; mimeType: string; sizeBytes: number; url: string };
        }>(
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
        if (uploaded.success && uploaded.file) {
          setAttachments((prev) => [
            ...prev,
            {
              id: `att-${Date.now()}-${Math.random()}`,
              name: uploaded.file.name,
              mimeType: uploaded.file.mimeType,
              sizeBytes: uploaded.file.sizeBytes,
              url: uploaded.file.url,
              uploadedBy: currentUser.id,
              uploadedAt: new Date().toISOString(),
            },
          ]);
        }
      }
    } catch (err: any) {
      setUploadError(err.message || 'تعذر رفع الملف');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!currentUser || !currentUser.id) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }

    if (clientNotes.trim().length < 10) {
      setSubmitError('يرجى كتابة وصف واضح لمتطلباتك (10 أحرف على الأقل).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await catalogFetch<{ success: boolean; order: ServiceOrder }>(
        '/api/service-orders',
        {
          method: 'POST',
          body: JSON.stringify({
            serviceId: service.id,
            packageId: selectedPackage?.id,
            deliveryMode: service.deliveryMode === 'both' ? deliveryMode : service.deliveryMode,
            clientNotes: clientNotes.trim(),
            attachments,
          }),
        },
        currentUser
      );
      setCreatedOrder(res.order);
      triggerCatalogRefresh();
      await refreshNotifications();
    } catch (err: any) {
      setSubmitError(err.message || 'حدث خطأ أثناء إرسال طلب الخدمة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!createdOrder) return;
    setIsPaying(true);
    setSubmitError(null);
    try {
      const res = await catalogFetch<{ success: boolean; order: ServiceOrder }>(
        `/api/service-orders/${encodeURIComponent(createdOrder.id)}/pay`,
        {
          method: 'POST',
          headers: {
            'Idempotency-Key': `IDEM-UI-${createdOrder.id}`,
          },
          body: JSON.stringify({
            paymentMethod,
            idempotencyKey: `IDEM-UI-${createdOrder.id}`,
          }),
        },
        currentUser
      );
      setPaymentDoneOrder(res.order);
      triggerCatalogRefresh();
      await refreshNotifications();
    } catch (err: any) {
      setSubmitError(err.message || 'تعذر تأكيد الدفع.');
    } finally {
      setIsPaying(false);
    }
  };

  const activeOrder = paymentDoneOrder || createdOrder;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 text-right"
        data-testid="service-order-modal"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-blue-200 font-semibold block">طلب خدمة استشارية موثقة</span>
            <h3 className="text-base sm:text-lg font-extrabold">{service.titleAr}</h3>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {!activeOrder ? (
          <form onSubmit={handleSubmitOrder} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Summary Preview */}
            <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <img
                src={service.providerAvatar}
                alt={service.providerName}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">
                  مقدم الخدمة: {service.providerName}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  مدة التنفيذ: {activeDays} أيام • التعديلات المتاحة: {service.revisionsCount}
                </span>
              </div>
              <div className="text-left shrink-0">
                <span className="text-lg font-black text-blue-700 block">
                  {activePriceEgp.toLocaleString('ar-EG')} ج.م
                </span>
                <span className="text-[10px] text-slate-500">شامل عمولة المنصة (15%)</span>
              </div>
            </div>

            {/* Packages selector if present */}
            {service.packages && service.packages.length > 0 && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">اختر الباقة المناسبة</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {service.packages.map((pkg) => {
                    const isSelected = (selectedPackageId || service.packages![0].id) === pkg.id;
                    return (
                      <button
                        type="button"
                        key={pkg.id}
                        onClick={() => setSelectedPackageId(pkg.id)}
                        className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70'
                            : 'border-slate-200 bg-white hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{pkg.nameAr}</span>
                          <span className="text-xs font-black text-blue-700">{pkg.priceEgp} ج.م</span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-1">
                          التنفيذ خلال {pkg.executionDays} أيام • {pkg.revisionsCount} تعديلات
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Delivery Mode */}
            {service.deliveryMode === 'both' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">طريقة التنفيذ المفضلة</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('online')}
                    className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
                      deliveryMode === 'online'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    أونلاين عن بُعد
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('in_person')}
                    className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
                      deliveryMode === 'in_person'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    مقابلة حضورية
                  </button>
                </div>
              </div>
            )}

            {/* Client Need Description */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                وصف احتياجك وتفاصيل الخدمة المطلوبة *
              </label>
              <textarea
                rows={4}
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                placeholder="اشرح وضعك الحالي والهدف المطلوب من الخدمة وأي ملاحظات أو مواعيد مفضلة..."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            {/* Safe File Attachments */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                إرفاق مستندات مساعدة (اختياري — PDF, Word, Excel, PNG, JPG حتى 5MB)
              </label>
              <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl bg-slate-50 hover:bg-blue-50/40 cursor-pointer transition text-xs font-semibold text-slate-700">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>{isUploading ? 'جاري رفع الملف...' : 'اختر ملفاً لإرفاقه مع الطلب'}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.txt"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>

              {uploadError && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5">{uploadError}</p>
              )}

              {attachments.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="font-medium text-slate-800 truncate">{att.name}</span>
                        <span className="text-[10px] text-slate-400">
                          ({Math.round(att.sizeBytes / 1024)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== att.id))}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        aria-label="حذف المرفق"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing & 15% Commission Transparency */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>قيمة الخدمة الاستشارية:</span>
                <span className="font-bold text-slate-900">{breakdown.priceEgp.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>تشمل عمولة الوساطة وضمان المنصة (15%):</span>
                <span className="font-semibold">{breakdown.feeEgp.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="flex items-start gap-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  يحتسب السعر النهائي وتأكيد الفاتورة بالكامل عبر خادم المنصة لضمان الشفافية ومنع أي تلاعب.
                </span>
              </div>
            </div>

            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {submitError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={resetAndClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                {isSubmitting ? 'جاري إرسال الطلب...' : 'تأكيد وإرسال طلب الخدمة'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-5">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-extrabold text-emerald-900">
                  {paymentDoneOrder
                    ? 'تم تأكيد سداد الطلب بنجاح!'
                    : 'تم تسجيل طلب الخدمة وإخطار مقدم الخدمة'}
                </h4>
                <p className="text-xs text-emerald-800 mt-1">
                  رقم الطلب المرجعي:{' '}
                  <strong className="font-mono" data-testid="created-order-number">
                    {activeOrder.orderNumber}
                  </strong>
                </p>
              </div>
            </div>

            {!paymentDoneOrder && (
              <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    يمكنك تأكيد الدفع الآن أو متابعة الطلب من لوحة التحكم. ملاحظة: عند غياب مفاتيح بوابة الدفع الحية في بيئة التجربة، يعمل السداد في{' '}
                    <strong>وضع المحاكاة المحلي</strong> لتسجيل الحالة والقيود المحاسبية.
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'card_online', label: 'بطاقة بنكية' },
                    { id: 'meeza', label: 'بطاقة ميزة' },
                    { id: 'fawry', label: 'فوري Fawry' },
                    { id: 'vodafone_cash', label: 'فودافون كاش' },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2.5 rounded-xl border font-bold cursor-pointer ${
                        paymentMethod === m.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {submitError && (
                  <p className="text-xs text-rose-600 font-semibold">{submitError}</p>
                )}

                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={isPaying}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {isPaying
                      ? 'جاري تأكيد السداد...'
                      : `تأكيد سداد ${activeOrder.priceEgp.toLocaleString('ar-EG')} ج.م الآن`}
                  </span>
                </button>
              </div>
            )}

            {paymentDoneOrder && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-900">حالة الطلب الحالية: تم الدفع (Paid)</p>
                <p className="text-slate-600">{paymentDoneOrder.paymentModeLabel}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={resetAndClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                متابعة التصفح
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAndClose();
                  setActiveView('dashboard');
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>الانتقال إلى طلباتي في لوحة التحكم</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
