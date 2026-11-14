import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { CategoryCatalog } from './components/CategoryCatalog';
import { ConsultantDirectory } from './components/ConsultantDirectory';
import { ServicesCatalog } from './components/ServicesCatalog';
import { ServiceDetailsPage } from './components/ServiceDetailsPage';
import { ServiceOrderModal } from './components/ServiceOrderModal';
import { RFQSection } from './components/RFQSection';
import { DashboardContainer } from './components/Dashboards/DashboardContainer';
import { HelpCenter } from './components/HelpCenter';
import { Footer } from './components/Footer';
import { ConsultantProfileModal } from './components/ConsultantProfileModal';
import { BookingModal } from './components/BookingModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { AuthModal } from './components/AuthModal';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Award,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Star,
  Users,
  Briefcase,
  Sparkles,
  Search,
} from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    activeView,
    setActiveView,
    selectedServiceId,
    navigateToServicesCatalog,
    categories,
    consultants,
    reviews,
    setSelectedConsultant,
    setIsBookingModalOpen,
    setIsRFQModalOpen,
    setIsAIModalOpen,
    lang,
  } = useApp();

  const [searchFilter, setSearchFilter] = useState<{ query: string; categoryId: string }>({
    query: '',
    categoryId: '',
  });

  const handleHeroSearch = (query: string, categoryId: string) => {
    setSearchFilter({ query, categoryId });
    setActiveView('consultants');
  };

  const handleCategorySelect = (categoryId: string) => {
    setSearchFilter({ query: '', categoryId });
    setActiveView('consultants');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] overflow-x-clip">
      <Navbar />

      <main className="flex-1">
        {/* VIEW: HOME */}
        {activeView === 'home' && (
          <div>
            {/* 1. Hero Section */}
            <HeroSection onSearch={handleHeroSearch} />

            {/* 2. Featured Categories Section */}
            <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-right">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    استكشف المجالات
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                    أبرز التخصصات الاستشارية طلباً في مصر
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    أكثر من 26 تخصصاً استشارياً تشمل الضرائب، تأسيس الشركات، القانون، التقنية، ودراسات الجدوى.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 self-start sm:self-auto">
                  <button
                    onClick={() => navigateToServicesCatalog()}
                    className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap"
                  >
                    <span>تصفح كتالوج الخدمات الجاهزة</span>
                    {lang === 'ar' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setActiveView('categories')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <span>استعراض جميع التخصصات (26+)</span>
                    {lang === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {categories.slice(0, 6).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 transition text-center cursor-pointer group flex flex-col items-center"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-600 group-hover:text-white text-blue-600 flex items-center justify-center transition mb-2">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition block">
                      {cat.nameAr}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {cat.consultantCount} مستشار معتمد
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* 3. Top Verified Consultants Showcase */}
            <section className="py-14 bg-white border-y border-slate-200 text-right">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                  <div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      معتمدون وموثقون رسمياً
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                      أفضل المستشارين المتاحين للحجز الفوري
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      خبراء تم فحص تراخيصهم المهنية وسجلات قيدهم بمصر لضمان أعلى مستوى من الكفاءة والموثوقية.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveView('consultants')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                  >
                    <span>عرض كامل دليل المستشارين</span>
                    {lang === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {consultants.slice(0, 3).map((consultant) => (
                    <div
                      key={consultant.id}
                      className="bg-slate-50 rounded-3xl p-5 border border-slate-200 hover:border-blue-400 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <img
                            src={consultant.avatar}
                            alt={consultant.nameAr}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-xs"
                          />
                          <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-lg text-xs font-bold border border-amber-200">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{consultant.rating.toFixed(2)}</span>
                            <span className="text-[10px] text-amber-600 font-normal">({consultant.reviewCount})</span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <h3 className="text-base font-bold text-slate-900">{consultant.nameAr}</h3>
                          <p className="text-xs text-blue-700 font-semibold mt-0.5">{consultant.titleAr}</p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            خبرة {consultant.yearsExperience} سنة • {consultant.city}
                          </p>
                        </div>

                        <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                          {consultant.bioAr}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-400 block">سعر الجلسة ({consultant.sessionDurationMinutes} دقيقة):</span>
                          <span className="text-base font-black text-slate-900">
                            {consultant.sessionRateEgp.toLocaleString('ar-EG')}{' '}
                            <span className="text-xs font-bold text-blue-600">ج.م</span>
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedConsultant(consultant)}
                            className="px-3 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                          >
                            الملف
                          </button>
                          <button
                            onClick={() => {
                              setSelectedConsultant(consultant);
                              setIsBookingModalOpen(true);
                            }}
                            className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-xs cursor-pointer"
                          >
                            حجز موعد
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 4. How Platform Works (4 Steps) */}
            <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-right">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  سهولة وموثوقية
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                  كيف تعمل منصة وسيط؟
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  رحلة استشارية متكاملة وسلسة تحمي حقوقك بالكامل من لحظة الاختيار وحتى انتهاء الجلسة.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    step: '01',
                    title: 'ابحث واختر الخبير',
                    desc: 'تصفح أكثر من 26 تخصصاً، قارن المستشارين وتأكد من شهادات القيد والتقييمات الموثقة.',
                    icon: Search,
                  },
                  {
                    step: '02',
                    title: 'حدد الموعد بتوقيت مصر',
                    desc: 'اختر اليوم والوقت المتاح مباشرة في جدول المستشار، مع ضمان عدم وجود أي تعارض زمني.',
                    icon: Clock,
                  },
                  {
                    step: '03',
                    title: 'ادفع تحت حماية الضمان',
                    desc: 'سدد بالجنيه المصري عبر ميزة أو فوري أو فودافون كاش، وتبقى أموالك معلقة في Escrow لحين اكتمال الجلسة.',
                    icon: ShieldCheck,
                  },
                  {
                    step: '04',
                    title: 'احضر جلستك واستلم المخرجات',
                    desc: 'التقِ بالمستشار عبر قاعة فيديو أو شات مباشر، استلم تقرير الاستشارة واعتمد تحرير المستحقات.',
                    icon: CheckCircle2,
                  },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs relative text-right flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className="text-2xl font-black text-slate-200 font-mono">{item.step}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 5. Why WASEET? (Trust Pillars) */}
            <section className="py-16 bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 text-white text-right">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <span className="text-xs font-bold text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-500/30">
                    ضمانات منصة وسيط
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                    لماذا يثق بنا آلاف الأفراد ورواد الأعمال في مصر؟
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    صممت منصة وسيط لمعالجة مخاطر الاستشارات غير الموثقة وضمان حقوق الطرفين بالكامل.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xs space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-white">نظام الضمان المالي الصارم (Escrow)</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      لا نخاطر بأموالك أبداً. تظل قيمة الاستشارة محفوظة في حساب الضمان البنكي ولا تُصرف للمستشار إلا بعد انعقاد الجلسة وتسليم المخرجات وموافقتك.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xs space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                      <Award className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-white">التحقق الصارم من التراخيص وسجلات القيد</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      كل مستشار يمر بفحص وتدقيق يدوي لشهادات التخرج، القيد بسجل المحاسبين والمراجعين، نقابة المحامين، وتراخيص الهيئات الحكومية المصرية.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xs space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-white">الجنيه المصري ووسائل الدفع المحلية</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      لا حاجة لبطاقات دولية أو رسوم تحويل عملة. ادفع ببطاقتك البنكية، بطاقة ميزة، فوري، أو فودافون كاش بكل سهولة وشفافية.
                    </p>
                  </div>
                </div>

                {/* Direct Action Banner */}
                <div className="mt-12 bg-white/10 border border-white/20 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-right">
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      لديك احتياج استشاري معقد وتريد عروض أسعار تنافسية؟
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      انشر طلبك مجاناً عبر سوق عروض الأسعار (RFQ) وتلقّ عروض الخبراء خلال ساعات.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setIsRFQModalOpen(true)}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer"
                    >
                      طلب عرض سعر (RFQ)
                    </button>
                    <button
                      onClick={() => setIsAIModalOpen(true)}
                      className="px-5 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                      <span>مساعد وسيط الذكي</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. Verified Reviews */}
            <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-right">
              <div className="text-center max-w-xl mx-auto mb-10">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  شهادات موثقة
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                  آراء عملاء استكملوا استشاراتهم في وسيط
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  تقييمات حقيقية لا تضاف إلا بعد انتهاء الجلسة الاستشارية واعتماد المعاملة بنجاح.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{rev.clientName}</span>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ✓ معاملة استشارية مكتملة
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(rev.createdAt).toLocaleDateString('ar-EG', { dateStyle: 'long' })}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* VIEW: CATEGORIES */}
        {activeView === 'categories' && (
          <CategoryCatalog onSelectCategory={handleCategorySelect} />
        )}

        {/* VIEW: CONSULTANTS */}
        {activeView === 'consultants' && (
          <ConsultantDirectory
            initialCategoryId={searchFilter.categoryId}
            initialQuery={searchFilter.query}
          />
        )}

        {/* VIEW: SERVICES */}
        {activeView === 'services' && <ServicesCatalog />}

        {/* VIEW: SERVICE DETAILS */}
        {activeView === 'service_detail' && selectedServiceId && (
          <ServiceDetailsPage serviceId={selectedServiceId} />
        )}

        {/* VIEW: RFQ */}
        {activeView === 'rfq' && <RFQSection />}

        {/* VIEW: DASHBOARD & ORDER WORKSPACE */}
        {(activeView === 'dashboard' || activeView === 'workspace') && <DashboardContainer />}

        {/* VIEW: HELP */}
        {activeView === 'help' && <HelpCenter />}
      </main>

      <Footer />

      {/* Globally Mounted Modals */}
      <ConsultantProfileModal />
      <BookingModal />
      <ServiceOrderModal />
      <AIAssistantModal />
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
