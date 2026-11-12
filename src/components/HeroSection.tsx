import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  ShieldCheck,
  Award,
  Clock,
  CreditCard,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const HeroSection: React.FC<{
  onSearch: (query: string, categoryId: string) => void;
}> = ({ onSearch }) => {
  const { lang, categories, setActiveView, setIsAIModalOpen, setIsRFQModalOpen } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery, selectedCategory);
  };

  const quickPills = [
    { label: 'الضرائب والفاتورة الإلكترونية', catId: 'cat-taxes' },
    { label: 'تأسيس شركات GAFI', catId: 'cat-incorporation' },
    { label: 'الاستشارات القانونية', catId: 'cat-legal' },
    { label: 'الذكاء الاصطناعي والبرمجة', catId: 'cat-ai' },
    { label: 'دراسات الجدوى المالية', catId: 'cat-financial-advisory' },
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-slate-50 to-white pt-8 pb-16 border-b border-slate-200">
      {/* Subtle decorative background circles */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-12 left-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          {/* Trust Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>منصة الوساطة الاستشارية الأولى في مصر للأفراد وأصحاب الأعمال</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            كل خبرة تحتاجها،{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600">
              تجدها في وسيط
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            احجز جلسات استشارية فردية ومباشرة (فيديو، صوت، أو محادثة) مع نخبة المستشارين والخبراء القانونيين والماليين
            والتقنيين المعتمدين في مصر، مع حماية كاملة لمدفوعاتك بنظام الضمان المالي (Escrow) بالجنيه المصري.
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-6 p-2 bg-white rounded-2xl shadow-xl shadow-blue-500/5 border border-slate-200 flex flex-col md:flex-row items-center gap-2"
          >
            {/* Search Input */}
            <div className="flex-1 flex items-center gap-2 px-3 w-full border-b md:border-b-0 md:border-l md:rtl:border-r md:rtl:border-l-0 border-slate-200 py-2">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن استشارة، تخصص، أو اسم مستشار (مثال: فحص ضريبي، عقد شراكة)..."
                className="w-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden bg-transparent"
              />
            </div>

            {/* Category Select */}
            <div className="w-full md:w-64 px-2 py-1">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="">جميع التخصصات (26+ مجال)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameAr} ({c.consultantCount} مستشار)
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              <span>ابحث عن مستشار</span>
              {lang === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">أكثر طلباً الآن:</span>
            {quickPills.map((p) => (
              <button
                key={p.catId}
                onClick={() => {
                  setSelectedCategory(p.catId);
                  onSearch('', p.catId);
                }}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-700 transition cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setActiveView('consultants')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              تصفح دليل المستشارين المعتمدين
            </button>
            <button
              onClick={() => setIsRFQModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              انشر طلب استشارة وتلقّ عروض الأسعار
            </button>
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-50 to-blue-50 hover:from-teal-100 hover:to-blue-100 border border-teal-200 text-teal-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>مساعد وسيط الذكي (AI)</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="text-right">
              <h4 className="text-xs font-bold text-slate-900">اعتماد حقيقي وتراخيص</h4>
              <p className="text-[11px] text-slate-500">فحص وتوثيق شهادات القيد المهني</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="text-right">
              <h4 className="text-xs font-bold text-slate-900">حماية الضمان (Escrow)</h4>
              <p className="text-[11px] text-slate-500">تحرير المبلغ فقط بعد انتهاء الجلسة</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-right">
              <h4 className="text-xs font-bold text-slate-900">مواعيد دقيقة مؤكدة</h4>
              <p className="text-[11px] text-slate-500">منع التعارض بتوقيت القاهرة</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="text-right">
              <h4 className="text-xs font-bold text-slate-900">طرق دفع مصرية محلية</h4>
              <p className="text-[11px] text-slate-500">ميزة، فوري، فودافون كاش وبطاقات</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
