import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CatalogService,
  ConsultantProfile,
  ServiceReviewItem,
} from '../types';
import { catalogFetch } from '../utils/catalogApi';
import {
  calculateServiceCommissionPiasters,
  SERVICE_PLATFORM_FEE_PERCENT,
} from '../utils/servicesCatalog';
import { ServiceCard } from './ServiceCard';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileCheck,
  Heart,
  HelpCircle,
  MapPin,
  MessageSquare,
  Monitor,
  RefreshCw,
  Send,
  ShieldCheck,
  ShoppingBag,
  Star,
  UserCheck,
  XCircle,
} from 'lucide-react';

export const ServiceDetailsPage: React.FC<{ serviceId: string }> = ({ serviceId }) => {
  const {
    currentUser,
    lang,
    consultants,
    setSelectedConsultant,
    navigateToService,
    navigateToServicesCatalog,
    setServiceOrderModalService,
    sendMessage,
    catalogRefreshTick,
  } = useApp();

  const [service, setService] = useState<CatalogService | null>(null);
  const [provider, setProvider] = useState<ConsultantProfile | null>(null);
  const [reviews, setReviews] = useState<ServiceReviewItem[]>([]);
  const [similarServices, setSimilarServices] = useState<CatalogService[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [selectedPkgIndex, setSelectedPkgIndex] = useState<number>(0);

  // Quick provider message
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactText, setContactText] = useState('');
  const [contactSent, setContactSent] = useState(false);

  // Review submission form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewStatus, setReviewStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadDetails = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setImgError(false);
    try {
      const data = await catalogFetch<{
        success: boolean;
        service: CatalogService;
        provider: ConsultantProfile | null;
        reviews: ServiceReviewItem[];
        similarServices: CatalogService[];
        isFavorited: boolean;
      }>(`/api/services/${encodeURIComponent(serviceId)}`, {}, currentUser);

      setService(data.service);
      setProvider(data.provider);
      setReviews(data.reviews || []);
      setSimilarServices(data.similarServices || []);
      setIsFavorited(Boolean(data.isFavorited));
    } catch (err: any) {
      setErrorMsg(err.message || 'تعذر تحميل تفاصيل الخدمة.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [serviceId, currentUser.id, catalogRefreshTick]);

  const handleToggleFavorite = async (id: string) => {
    try {
      const res = await catalogFetch<{ success: boolean; isFavorited: boolean }>(
        `/api/services/${encodeURIComponent(id)}/favorite`,
        { method: 'POST' },
        currentUser
      );
      if (id === serviceId) setIsFavorited(res.isFavorited);
    } catch {
      // ignore
    }
  };

  const handleSendContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !contactText.trim()) return;
    sendMessage(`srv-inq-${service.id}`, service.providerUserId, contactText.trim());
    setContactText('');
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setIsContactOpen(false);
    }, 2500);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;
    setReviewStatus(null);
    try {
      const res = await catalogFetch<{ success: boolean; review: ServiceReviewItem; service: CatalogService }>(
        `/api/services/${encodeURIComponent(service.id)}/reviews`,
        {
          method: 'POST',
          body: JSON.stringify({
            rating: reviewRating,
            comment: reviewComment.trim(),
          }),
        },
        currentUser
      );
      setReviews((prev) => [res.review, ...prev]);
      setService(res.service);
      setReviewComment('');
      setReviewStatus({ type: 'ok', text: 'تم نشر تقييمك الموثق بنجاح!' });
    } catch (err: any) {
      setReviewStatus({ type: 'err', text: err.message || 'تعذر نشر التقييم.' });
    }
  };

  if (isLoading) {
    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="aspect-[16/9] bg-slate-200 rounded-3xl" />
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-32 bg-slate-100 rounded-2xl" />
          </div>
          <div className="lg:col-span-4 h-96 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (errorMsg || !service) {
    return (
      <div className="py-16 px-4 max-w-xl mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">{errorMsg || 'الخدمة غير موجودة'}</h2>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigateToServicesCatalog()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            العودة إلى كتالوج الخدمات
          </button>
          <button
            type="button"
            onClick={loadDetails}
            className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      </div>
    );
  }

  const activePkg = service.packages && service.packages[selectedPkgIndex];
  const displayPriceEgp = activePkg ? activePkg.priceEgp : service.priceEgp;
  const displayDays = activePkg ? activePkg.executionDays : service.executionDays;
  const displayRevisions = activePkg ? activePkg.revisionsCount : service.revisionsCount;
  const feeBreakdown = calculateServiceCommissionPiasters(displayPriceEgp, SERVICE_PLATFORM_FEE_PERCENT);

  const deliveryText =
    service.deliveryMode === 'online'
      ? 'أونلاين عن بُعد'
      : service.deliveryMode === 'in_person'
      ? 'حضوري بمقر المستشار'
      : 'أونلاين أو حضوري';

  const consultantObj =
    provider || consultants.find((c) => c.id === service.consultantId) || null;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-right space-y-10" data-testid="service-details-page">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
        <button
          type="button"
          onClick={() => navigateToServicesCatalog()}
          className="text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5 ltr:rotate-180" />
          <span>كتالوج الخدمات الاستشارية</span>
        </button>
        <span>/</span>
        <button
          type="button"
          onClick={() => navigateToServicesCatalog({ categoryId: service.categoryId })}
          className="hover:text-slate-900 cursor-pointer"
        >
          {service.categoryNameAr}
        </button>
        <span>/</span>
        <span className="text-slate-800 font-semibold truncate max-w-md">{service.titleAr}</span>
      </nav>

      {/* Main 12-Col Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left/Main Column (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Header & Image */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="aspect-[16/9] bg-slate-100 relative">
              {!imgError && service.imageUrl ? (
                <img
                  src={service.imageUrl}
                  alt={service.titleAr}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center text-slate-500 text-sm font-bold">
                  {service.categoryNameAr}
                </div>
              )}
              {service.isDemo && (
                <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 text-white text-[11px] font-semibold">
                  خدمة عرض تجريبية (Demo)
                </span>
              )}
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-200">
                    {service.categoryNameAr}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                    {service.subcategoryNameAr}
                  </span>
                  {service.requiresLicense && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      ترخيص مهني موثق
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-amber-700 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{service.rating > 0 ? service.rating.toFixed(2) : 'جديد'}</span>
                  <span className="text-slate-400 font-normal">({service.reviewCount} تقييم)</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600 font-semibold">{service.ordersCount} طلب</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
                {lang === 'ar' ? service.titleAr : service.titleEn}
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                {lang === 'ar' ? service.fullDescriptionAr : service.fullDescriptionEn}
              </p>
            </div>
          </div>

          {/* Scope Inclusions & Exclusions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>نطاق الخدمة وما تشمله</span>
              </h2>
              <ul className="space-y-2 text-xs text-slate-700">
                {service.includedAr.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-500" />
                <span>ما لا تشمله الخدمة</span>
              </h2>
              <ul className="space-y-2 text-xs text-slate-600">
                {(service.excludedAr.length > 0
                  ? service.excludedAr
                  : ['الرسوم الحكومية أو الضرائب المستحقة للجهات الرسمية', 'الأعمال التنفيذية خارج النطاق المحدد أعلاه']
                ).map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold mt-0.5">✕</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Deliverables & Client Prerequisites */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                <span>المخرجات النهائية المستلمة</span>
              </h2>
              <ul className="space-y-2 text-xs text-slate-700">
                {service.deliverablesAr.map((d, i) => (
                  <li key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 font-medium">
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-600" />
                <span>المتطلبات من العميل قبل البدء</span>
              </h2>
              <ul className="space-y-2 text-xs text-slate-700">
                {service.prerequisitesAr.map((p, i) => (
                  <li key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 font-medium">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Execution Milestones */}
          {service.milestones.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-base font-extrabold text-slate-900">مراحل تنفيذ الخدمة</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {service.milestones.map((ms) => (
                  <div key={ms.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-black text-blue-700">المرحلة 0{ms.stepNumber}</span>
                      <span className="text-slate-500 font-semibold">{ms.durationDays} يوم</span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900">{ms.titleAr}</h3>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{ms.descriptionAr}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQs */}
          {service.faqs.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <span>الأسئلة الشائعة حول الخدمة</span>
              </h2>
              <div className="divide-y divide-slate-100">
                {service.faqs.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <div key={faq.id} className="py-3">
                      <button
                        type="button"
                        onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                        className="w-full flex items-center justify-between text-right text-xs font-bold text-slate-900 cursor-pointer"
                      >
                        <span>{faq.questionAr}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">{faq.answerAr}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Verified Reviews + Submission */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900">
                تقييمات العملاء الفعليين ({reviews.length})
              </h2>
              <span className="text-xs text-emerald-700 font-bold">مرتبطة بطلبات مكتملة</span>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{rev.clientName}</span>
                        {rev.verifiedPurchase && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ مشتري موثق
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(rev.rating)].map((_, idx) => (
                          <Star key={idx} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">لا توجد تقييمات مكتوبة على هذه الخدمة حتى الآن.</p>
            )}

            {/* Add Review Form */}
            <form onSubmit={handleSubmitReview} className="pt-4 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-slate-800">أضف تقييمك (متاح بعد إتمام طلب الخدمة)</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">التقييم:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="اكتب تجربتك مع هذه الخدمة..."
                  className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  نشر التقييم
                </button>
              </div>
              {reviewStatus && (
                <p
                  className={`text-xs font-semibold ${
                    reviewStatus.type === 'ok' ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {reviewStatus.text}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Sticky Sidebar (4 cols) */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* Pricing & Order Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            {service.packages && service.packages.length > 0 && (
              <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
                {service.packages.map((pkg, idx) => (
                  <button
                    type="button"
                    key={pkg.id}
                    onClick={() => setSelectedPkgIndex(idx)}
                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedPkgIndex === idx ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {pkg.nameAr}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 block">سعر الخدمة</span>
                <span className="text-3xl font-black text-slate-900">
                  {displayPriceEgp.toLocaleString('ar-EG')}{' '}
                  <span className="text-sm font-bold text-blue-600">ج.م</span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleToggleFavorite(service.id)}
                className={`p-2.5 rounded-xl border transition cursor-pointer ${
                  isFavorited
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-rose-600'
                }`}
                aria-label="حفظ في المفضلة"
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-600' : ''}`} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-4 h-4 text-blue-600" />
                  مدة التنفيذ المتوقعة
                </span>
                <strong className="text-slate-900">{displayDays} أيام عمل</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <RefreshCw className="w-4 h-4 text-teal-600" />
                  عدد التعديلات المتاحة
                </span>
                <strong className="text-slate-900">{displayRevisions} تعديلات</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  {service.deliveryMode === 'in_person' ? (
                    <MapPin className="w-4 h-4 text-teal-600" />
                  ) : (
                    <Monitor className="w-4 h-4 text-blue-600" />
                  )}
                  طريقة التقديم
                </span>
                <strong className="text-slate-900">{deliveryText}</strong>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
                <span>عمولة منصة وسيط المشمولة (15%)</span>
                <span className="font-bold text-slate-700">{feeBreakdown.feeEgp.toLocaleString('ar-EG')} ج.م</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setServiceOrderModalService(service)}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-extrabold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                data-testid="order-service-cta"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>طلب الخدمة الآن</span>
              </button>

              <button
                type="button"
                onClick={() => setIsContactOpen((p) => !p)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>التواصل مع مقدم الخدمة</span>
              </button>
            </div>

            {isContactOpen && (
              <form onSubmit={handleSendContact} className="pt-3 border-t border-slate-100 space-y-2">
                <textarea
                  rows={3}
                  value={contactText}
                  onChange={(e) => setContactText(e.target.value)}
                  placeholder="اكتب استفسارك لمقدم الخدمة قبل الطلب..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال الاستفسار</span>
                </button>
                {contactSent && (
                  <p className="text-xs text-emerald-700 font-bold text-center">
                    تم إرسال رسالتك إلى {service.providerName} بنجاح.
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Linked Provider Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <span className="text-xs font-bold text-slate-400 block">مقدم الخدمة الاستشارية</span>
            <div className="flex items-center gap-3">
              <img
                src={service.providerAvatar}
                alt={service.providerName}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
              />
              <div>
                <div className="flex items-center gap-1">
                  <h3 className="text-sm font-bold text-slate-900">{service.providerName}</h3>
                  {service.providerVerified && (
                    <CheckCircle className="w-4 h-4 text-blue-600" aria-label="مستشار موثق" />
                  )}
                </div>
                <p className="text-xs text-blue-700 font-semibold">{service.providerTitle}</p>
                {consultantObj && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    خبرة {consultantObj.yearsExperience} سنة • {consultantObj.city}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {consultantObj && (
                <button
                  type="button"
                  onClick={() => setSelectedConsultant(consultantObj)}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                >
                  ملف المستشار
                </button>
              )}
              <button
                type="button"
                onClick={() => navigateToServicesCatalog({ providerId: service.consultantId })}
                className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                كل خدماته
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Similar Services */}
      {similarServices.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-lg font-extrabold text-slate-900">خدمات استشارية مشابهة قد تهمك</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similarServices.map((sim) => (
              <ServiceCard
                key={sim.id}
                service={sim}
                isFavorited={false}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetails={navigateToService}
                onOrderService={setServiceOrderModalService}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
