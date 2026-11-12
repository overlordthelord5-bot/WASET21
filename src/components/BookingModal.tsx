import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Calendar,
  Clock,
  ShieldCheck,
  CreditCard,
  Video,
  Mic,
  MessageSquare,
  FileText,
  Building,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { generateAvailableSlots, AvailableSlot } from '../utils/booking';
import { DeliveryMode } from '../types';
import { calculateCommission } from '../utils/ledger';

export const BookingModal: React.FC = () => {
  const {
    selectedConsultant,
    isBookingModalOpen,
    setIsBookingModalOpen,
    bookingPreselectedService,
    setBookingPreselectedService,
    availabilityRules,
    bookings,
    createBooking,
    platformFeePercent,
    setActiveView,
    lang,
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedMode, setSelectedMode] = useState<DeliveryMode>('video');
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card_online' | 'meeza' | 'vodafone_cash' | 'fawry'>('card_online');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Reset or initialize state
  useEffect(() => {
    if (isBookingModalOpen) {
      setStep(1);
      setSelectedSlot(null);
      setBookingError(null);
      setConfirmedBookingId(null);
      if (bookingPreselectedService) {
        setSelectedMode(bookingPreselectedService.deliveryMode);
      } else if (selectedConsultant && selectedConsultant.deliveryModes.length > 0) {
        setSelectedMode(selectedConsultant.deliveryModes[0]);
      }
    }
  }, [isBookingModalOpen, bookingPreselectedService, selectedConsultant]);

  if (!isBookingModalOpen || !selectedConsultant) return null;

  const sessionDuration = bookingPreselectedService
    ? bookingPreselectedService.durationMinutes
    : selectedConsultant.sessionDurationMinutes;

  const sessionPriceEgp = bookingPreselectedService
    ? bookingPreselectedService.priceEgp
    : selectedConsultant.sessionRateEgp;

  const commission = calculateCommission(sessionPriceEgp, platformFeePercent);

  const availableSlots = generateAvailableSlots(
    availabilityRules,
    bookings,
    selectedConsultant.id,
    new Date(),
    7
  );

  const handleConfirmAndPay = () => {
    if (!selectedSlot) {
      setBookingError('يرجى اختيار الموعد المناسب أولاً');
      return;
    }

    setIsSubmitting(true);
    setBookingError(null);

    // Call createBooking
    const result = createBooking({
      consultantId: selectedConsultant.id,
      serviceId: bookingPreselectedService?.id,
      serviceTitle: bookingPreselectedService?.titleAr || `جلسة استشارة فردية - ${selectedConsultant.nameAr}`,
      categoryId: selectedConsultant.categoryIds[0] || 'cat-general',
      scheduledAt: selectedSlot.slotStart,
      durationMinutes: sessionDuration,
      priceEgp: sessionPriceEgp,
      deliveryMode: selectedMode,
      notes,
      paymentMethod,
    });

    setIsSubmitting(false);

    if (result.success && result.bookingId) {
      setConfirmedBookingId(result.bookingId);
      setStep(4); // Success step
    } else {
      setBookingError(result.error || 'تعذر إتمام الحجز، يرجى المحاولة مرة أخرى.');
    }
  };

  const handleClose = () => {
    setIsBookingModalOpen(false);
    setBookingPreselectedService(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">حجز استشارة مؤكدة مع المستشار</h3>
              <p className="text-xs text-slate-400">
                {selectedConsultant.nameAr} • {selectedConsultant.titleAr}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        {step < 4 && (
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className={`font-bold ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
              1. الطريقة والخدمة
            </span>
            <span className="text-slate-300">←</span>
            <span className={`font-bold ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
              2. اختيار الموعد (القاهرة)
            </span>
            <span className="text-slate-300">←</span>
            <span className={`font-bold ${step >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>
              3. الضمان والدفع (EGP)
            </span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-6 text-right">
          {bookingError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{bookingError}</span>
            </div>
          )}

          {/* STEP 1: Method & Service */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  الخدمة المختارة
                </h4>
                <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">
                      {bookingPreselectedService?.titleAr || 'جلسة استشارة فردية ومباشرة'}
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5">المدة: {sessionDuration} دقيقة متواصلة</p>
                  </div>
                  <div className="text-left">
                    <span className="text-base font-black text-blue-700">
                      {sessionPriceEgp.toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  طريقة عقد الجلسة الاستشارية
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'video', label: 'جلسة فيديو', desc: 'محادثة فيديو عالية الدقة', icon: Video },
                    { id: 'audio', label: 'مكالمة صوتية', desc: 'اتصال صوتي فوري مشفر', icon: Mic },
                    { id: 'chat', label: 'محادثة نصية', desc: 'شات كتابي وتبادل ملفات', icon: MessageSquare },
                    { id: 'written', label: 'استشارة كتابية', desc: 'تقرير فني موثق', icon: FileText },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = selectedMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMode(m.id as DeliveryMode)}
                        className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 block">{m.label}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{m.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>التالي: اختيار الموعد</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Time Slot Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  جميع المواعيد المعروضة متاحة ومؤكدة بتوقيت القاهرة (Africa/Cairo) دون أي تعارض زمني.
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  اختر اليوم والوقت المناسب
                </h4>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1">
                    {availableSlots.map((slot, idx) => {
                      const isSelected = selectedSlot?.slotStart === slot.slotStart;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                              : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400 hover:bg-blue-50/40'
                          }`}
                        >
                          <span className="text-xs font-bold block">{slot.displayDate}</span>
                          <span className={`text-xs block mt-0.5 font-semibold ${isSelected ? 'text-blue-100' : 'text-blue-600'}`}>
                            {slot.displayTime}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">
                    لا تتوفر مواعيد شاغرة لهذا المستشار خلال الأيام القادمة.
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ملاحظات أو أسئلة ترغب في طرحها أثناء الجلسة (اختياري)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="اكتب نبذة عن موضوع الاستشارة لمساعدة المستشار في التحضير..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  رجوع
                </button>
                <button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>التالي: تفاصيل الدفع والضمان</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Breakdown & Escrow */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Escrow Guarantee Box */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">حماية الضمان المالي الكاملة (Escrow)</h4>
                  <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                    أموالك لا تذهب إلى المستشار فوراً، بل تبقى محفوظة بأمان في حساب الضمان التابع لمنصة وسيط.
                    يتم تحرير المستحقات فقط بعد انتهاء الجلسة الاستشارية ورضاك التام أو تقديم مخرجات العمل.
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>سعر الجلسة الاستشارية ({sessionDuration} دقيقة):</span>
                  <span className="font-semibold text-slate-900">{sessionPriceEgp.toLocaleString('ar-EG')} ج.م</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>رسوم وساطة منصة وسيط (15%):</span>
                  <span className="font-medium text-emerald-600">شاملة ومدرجة بالكامل</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                  <span>إجمالي المبلغ المطلوب سداده:</span>
                  <span className="text-blue-700">{sessionPriceEgp.toLocaleString('ar-EG')} جنيه مصري</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  طريقة الدفع (بوابات الدفع المصرية المعتمدة)
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'card_online', name: 'بطاقة بنكية (Visa / Master)', desc: 'دفع فوري مشفر 3D Secure' },
                    { id: 'meeza', name: 'بطاقة ميزة الوطنية', desc: 'بطاقات الخصم والدفع الوطنية' },
                    { id: 'vodafone_cash', name: 'فودافون كاش / المحافظ', desc: 'المحافظ الإلكترونية الذكية' },
                    { id: 'fawry', name: 'فوري Pay', desc: 'الدفع بكود فوري من أي منفذ' },
                  ].map((m) => {
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-900 block">{m.name}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{m.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  رجوع
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmAndPay}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>تأكيد الحجز والإيداع في حساب الضمان</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Confirmation & Success */}
          {step === 4 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">تم تأكيد حجز الاستشارة بنجاح!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  تم تسجيل الحجز برقم <span className="font-mono font-bold text-blue-600">{confirmedBookingId}</span> وإيداع المبلغ في حساب الضمان.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 max-w-md mx-auto text-xs text-right space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">المستشار:</span>
                  <span className="font-bold text-slate-800">{selectedConsultant.nameAr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الموعد المحدد:</span>
                  <span className="font-bold text-slate-800">{selectedSlot?.displayDate} الساعة {selectedSlot?.displayTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">رابط قاعة الاجتماع:</span>
                  <span className="text-blue-600 font-mono text-[11px]">meet.waseet.eg/room/{confirmedBookingId}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => {
                    handleClose();
                    setActiveView('dashboard');
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>متابعة الحجز في لوحة التحكم</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  العودة للرئيسية
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
