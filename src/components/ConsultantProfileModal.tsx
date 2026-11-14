import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Star,
  CheckCircle,
  MapPin,
  Clock,
  Award,
  GraduationCap,
  Briefcase,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Video,
  Mic,
  FileText,
  Building,
  Check,
} from 'lucide-react';
import { generateAvailableSlots } from '../utils/booking';
import { CatalogService, ConsultationService } from '../types';
import { catalogFetch } from '../utils/catalogApi';

export const ConsultantProfileModal: React.FC = () => {
  const {
    selectedConsultant,
    setSelectedConsultant,
    isBookingModalOpen,
    setIsBookingModalOpen,
    setBookingPreselectedService,
    services,
    availabilityRules,
    bookings,
    reviews,
    lang,
    currentUser,
    navigateToService,
    navigateToServicesCatalog,
    setServiceOrderModalService,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'reviews' | 'slots'>('overview');
  const [catalogServices, setCatalogServices] = React.useState<CatalogService[]>([]);

  React.useEffect(() => {
    if (!selectedConsultant) return;
    let mounted = true;
    catalogFetch<{ success: boolean; items: CatalogService[] }>(
      `/api/services?providerId=${encodeURIComponent(selectedConsultant.id)}&pageSize=20`,
      {},
      currentUser
    )
      .then((res) => {
        if (mounted) setCatalogServices(res.items || []);
      })
      .catch(() => {
        if (mounted) setCatalogServices([]);
      });
    return () => {
      mounted = false;
    };
  }, [selectedConsultant?.id]);

  if (!selectedConsultant || isBookingModalOpen) return null;

  const consultantServices = services.filter((s) => s.consultantId === selectedConsultant.id);
  const consultantReviews = reviews.filter((r) => r.consultantId === selectedConsultant.id);
  const availableSlots = generateAvailableSlots(
    availabilityRules,
    bookings,
    selectedConsultant.id,
    new Date(),
    7
  );

  const handleBookService = (service: ConsultationService) => {
    setBookingPreselectedService(service);
    setIsBookingModalOpen(true);
  };

  const handleBookGeneralSession = () => {
    setBookingPreselectedService(null);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-6 relative">
          <button
            onClick={() => setSelectedConsultant(null)}
            className="absolute left-4 top-4 text-white/80 hover:text-white p-1 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative">
              <img
                src={selectedConsultant.avatar}
                alt={selectedConsultant.nameAr}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white/20 shadow-lg"
              />
              {selectedConsultant.verificationStatus === 'verified' && (
                <span
                  className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1.5 rounded-full shadow-md"
                  title="مستشار معتمد وموثق رسمياً"
                >
                  <CheckCircle className="w-4 h-4" />
                </span>
              )}
            </div>

            <div className="text-center sm:text-right flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  {lang === 'ar' ? selectedConsultant.nameAr : selectedConsultant.nameEn}
                </h2>
                <span className="bg-blue-500/30 text-blue-200 border border-blue-400/30 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  مستشار معتمد
                </span>
              </div>

              <p className="text-sm text-blue-100 font-medium mt-1">
                {lang === 'ar' ? selectedConsultant.titleAr : selectedConsultant.titleEn}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-blue-200">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {selectedConsultant.city}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  خبرة {selectedConsultant.yearsExperience} سنة
                </span>
                <span className="flex items-center gap-1 bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  {selectedConsultant.rating.toFixed(2)} ({selectedConsultant.reviewCount} تقييم موثق)
                </span>
              </div>
            </div>

            {/* Quick Price & Action in Header */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center shrink-0">
              <span className="text-xs text-blue-200 block">سعر الجلسة ({selectedConsultant.sessionDurationMinutes} دقيقة):</span>
              <span className="text-xl font-black text-white">
                {selectedConsultant.sessionRateEgp.toLocaleString('ar-EG')} <span className="text-xs font-semibold">ج.م</span>
              </span>
              <button
                onClick={handleBookGeneralSession}
                className="mt-2 w-full px-4 py-2 bg-white text-blue-900 rounded-xl text-xs font-bold hover:bg-blue-50 transition shadow-md cursor-pointer flex items-center justify-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>حجز استشارة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            الملف التعريفي والاعتمادات
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'services'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>الباقات والخدمات</span>
            <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 rounded-full">
              {consultantServices.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('slots')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'slots'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>المواعيد المتاحة</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full">
              {availableSlots.length} موعد
            </span>
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>آراء وتقييمات العملاء</span>
            <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full">
              {consultantReviews.length}
            </span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6 text-right">
              {/* Bio */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  النبذة المهنية والخبرات
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {lang === 'ar' ? selectedConsultant.bioAr : selectedConsultant.bioEn}
                </p>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">مجالات التخصص الدقيق</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedConsultant.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-xl border border-blue-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Verified Certifications & Licenses */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span>الشهادات والتراخيص المهنية المعتمدة</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedConsultant.certifications.map((cert, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-start gap-3 shadow-xs"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900">{cert.title}</h5>
                        <p className="text-[11px] text-slate-500 mt-0.5">الجهة: {cert.issuer}</p>
                        {cert.licenseNumber && (
                          <p className="text-[10px] text-blue-600 font-mono mt-0.5">رقم القيد: {cert.licenseNumber}</p>
                        )}
                        <span className="inline-block mt-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.2 rounded">
                          ✓ تم التحقق والمطابقة الرسمية
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Qualifications */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>المؤهلات الأكاديمية</span>
                </h4>
                <div className="space-y-2">
                  {selectedConsultant.qualifications.map((q, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{q.degree}</span>
                        <span className="text-slate-500 block text-[11px]">{q.institution}</span>
                      </div>
                      <span className="text-slate-400 font-semibold">{q.year}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-5 text-right">
              {catalogServices.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                      خدمات المستشار في كتالوج الخدمات ({catalogServices.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        const cId = selectedConsultant.id;
                        setSelectedConsultant(null);
                        navigateToServicesCatalog({ providerId: cId });
                      }}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      عرض جميع خدماته في الكتالوج ←
                    </button>
                  </div>

                  {catalogServices.map((csrv) => (
                    <div
                      key={csrv.id}
                      className="bg-blue-50/40 p-4 rounded-2xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-blue-700">{csrv.categoryNameAr}</span>
                        <h5 className="text-sm font-bold text-slate-900">{csrv.titleAr}</h5>
                        <p className="text-xs text-slate-600 line-clamp-2">{csrv.shortDescriptionAr}</p>
                        <span className="text-xs font-black text-slate-900 block pt-1">
                          {csrv.priceEgp.toLocaleString('ar-EG')} ج.م • التنفيذ خلال {csrv.executionDays} أيام
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedConsultant(null);
                            navigateToService(csrv.id);
                          }}
                          className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          تفاصيل الخدمة
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedConsultant(null);
                            setServiceOrderModalService(csrv);
                          }}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          طلب الخدمة
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                الباقات الاستشارية وجلسات الحجز المباشر
              </h4>
              {consultantServices.map((srv) => (
                <div
                  key={srv.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h5 className="text-sm font-bold text-slate-900">{srv.titleAr}</h5>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-blue-700">
                        {srv.priceEgp.toLocaleString('ar-EG')} ج.م
                      </span>
                      <span className="text-[11px] text-slate-400">({srv.durationMinutes} دقيقة)</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{srv.descriptionAr}</p>

                  <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                    <span className="font-semibold text-slate-700 block">مخرجات الخدمة:</span>
                    {srv.deliverablesAr.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-500">طريقة التسليم: جلسة فيديو عبر الإنترنت</span>
                    <button
                      onClick={() => handleBookService(srv)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      طلب هذه الخدمة
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'slots' && (
            <div className="space-y-4 text-right">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  جميع المواعيد المتاحة مولدة تلقائياً حسب جدول المستشار، ومتوافقة مع توقيت جمهورية مصر العربية (توقيت القاهرة).
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {availableSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIsBookingModalOpen(true);
                    }}
                    className="p-3 bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 rounded-xl text-center transition cursor-pointer group"
                  >
                    <span className="text-xs font-bold text-slate-800 block group-hover:text-blue-700">
                      {slot.displayDate}
                    </span>
                    <span className="text-[11px] font-semibold text-blue-600 block mt-0.5">
                      {slot.displayTime}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-1 block">متاح للحجز</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4 text-right">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                تقييمات موثقة من عملاء استكملوا الاستشارة
              </h4>
              {consultantReviews.length > 0 ? (
                consultantReviews.map((rev) => (
                  <div key={rev.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{rev.clientName}</span>
                        {rev.verifiedTransaction && (
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                            ✓ استشارة مكتملة موثقة
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(rev.createdAt).toLocaleDateString('ar-EG', { dateStyle: 'long' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  لا توجد تقييمات منشورة حتى الآن بعد آخر تحديث.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setSelectedConsultant(null)}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            إغلاق
          </button>

          <button
            onClick={handleBookGeneralSession}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            <span>حجز الجلسة الآن</span>
          </button>
        </div>
      </div>
    </div>
  );
};
