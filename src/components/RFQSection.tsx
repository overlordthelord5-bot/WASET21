import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  PlusCircle,
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  User,
  Star,
  CheckCircle,
  Send,
  X,
  FileText,
  Sparkles,
} from 'lucide-react';

export const RFQSection: React.FC = () => {
  const {
    rfqs,
    categories,
    currentUser,
    createRFQ,
    submitRFQProposal,
    acceptRFQProposal,
    isRFQModalOpen,
    setIsRFQModalOpen,
    setIsAIModalOpen,
    lang,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'my_rfqs'>('all');
  const [selectedRfqForProposal, setSelectedRfqForProposal] = useState<string | null>(null);

  // Proposal Form State
  const [proposalPrice, setProposalPrice] = useState<number>(3000);
  const [proposalDays, setProposalDays] = useState<number>(3);
  const [proposalNote, setProposalNote] = useState('');

  // New RFQ Form State
  const [rfqTitle, setRfqTitle] = useState('');
  const [rfqCategory, setRfqCategory] = useState(categories[0]?.id || '');
  const [rfqDesc, setRfqDesc] = useState('');
  const [budgetMin, setBudgetMin] = useState<number>(1500);
  const [budgetMax, setBudgetMax] = useState<number>(4000);
  const [requiredDate, setRequiredDate] = useState('2026-11-28');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfqTitle.trim() || !rfqDesc.trim()) return;

    createRFQ({
      title: rfqTitle,
      description: rfqDesc,
      categoryId: rfqCategory,
      budgetMinEgp: budgetMin,
      budgetMaxEgp: budgetMax,
      requiredByDate: requiredDate,
    });

    setIsRFQModalOpen(false);
    setRfqTitle('');
    setRfqDesc('');
  };

  const handleProposalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfqForProposal || !proposalNote.trim()) return;

    submitRFQProposal(selectedRfqForProposal, proposalPrice, proposalDays, proposalNote);
    setSelectedRfqForProposal(null);
    setProposalNote('');
  };

  const displayedRfqs = activeTab === 'my_rfqs'
    ? rfqs.filter((r) => r.clientId === currentUser.id)
    : rfqs;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
            <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>سوق عروض الأسعار التنافسية (RFQ)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            طلبات عروض أسعار الاستشارات
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            اطرح احتياجك الاستشاري وتلقّ عروض أسعار تفصيلية من المستشارين المعتمدين، قارن الخبرات والتكاليف، واختر العرض الأنسب لمشروعك.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAIModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-50 to-blue-50 hover:from-teal-100 hover:to-blue-100 border border-teal-200 text-teal-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>مساعد AI لكتابة الطلب</span>
          </button>
          <button
            onClick={() => setIsRFQModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>نشر طلب استشارة جديد</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3 mb-6 text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          جميع طلبات الاستشارة النشطة ({rfqs.length})
        </button>
        <button
          onClick={() => setActiveTab('my_rfqs')}
          className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            activeTab === 'my_rfqs'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          طلباتي المنشورة ({rfqs.filter((r) => r.clientId === currentUser.id).length})
        </button>
      </div>

      {/* RFQ List */}
      <div className="space-y-6">
        {displayedRfqs.map((rfq) => {
          const category = categories.find((c) => c.id === rfq.categoryId);
          const isOwner = rfq.clientId === currentUser.id;
          const isConsultant = currentUser.role === 'consultant';

          return (
            <div
              key={rfq.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-blue-300 transition-all text-right space-y-4"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                    {rfq.rfqNumber}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                    {category ? category.nameAr : 'تخصص عام'}
                  </span>
                  {rfq.status === 'open' && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      مفتوح لتلقي العروض
                    </span>
                  )}
                  {rfq.status === 'awarded' && (
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      تم اختيار العرض المناسب
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>الناشر: {rfq.clientName}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>مطلوب قبل: {rfq.requiredByDate}</span>
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-base font-bold text-slate-900">{rfq.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-1.5">{rfq.description}</p>
              </div>

              {/* Budget & Meta */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">الميزانية التقديرية المقترحة:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {rfq.budgetMinEgp.toLocaleString('ar-EG')} - {rfq.budgetMaxEgp.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-semibold">
                    العروض المقدمة: <span className="text-blue-600 font-bold">{rfq.proposals.length}</span>
                  </span>

                  {isConsultant && rfq.status === 'open' && (
                    <button
                      onClick={() => setSelectedRfqForProposal(rfq.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>تقديم عرض سعر</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Submitted Proposals List */}
              {rfq.proposals.length > 0 && (
                <div className="pt-2 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    عروض المستشارين المقدمة ({rfq.proposals.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {rfq.proposals.map((prop) => (
                      <div
                        key={prop.id}
                        className={`p-4 rounded-xl border transition ${
                          prop.status === 'accepted'
                            ? 'bg-emerald-50 border-emerald-400'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={prop.consultantAvatar}
                              alt={prop.consultantName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-900 block">{prop.consultantName}</span>
                              <div className="flex items-center gap-1 text-[10px] text-amber-600">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{prop.consultantRating}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-left">
                            <span className="text-sm font-extrabold text-blue-700 block">
                              {prop.proposedPriceEgp.toLocaleString('ar-EG')} ج.م
                            </span>
                            <span className="text-[10px] text-slate-500">خلال {prop.executionDays} أيام</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          {prop.coverNote}
                        </p>

                        {isOwner && rfq.status === 'open' && (
                          <div className="flex justify-end">
                            <button
                              onClick={() => acceptRFQProposal(rfq.id, prop.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                            >
                              قبول هذا العرض والبدء
                            </button>
                          </div>
                        )}

                        {prop.status === 'accepted' && (
                          <div className="text-xs font-bold text-emerald-700 flex items-center gap-1 justify-end">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>تم قبول هذا العرض رسمياً</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal for Submitting a Proposal */}
      {selectedRfqForProposal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">تقديم عرض سعر رسمي للمشروع</h3>
              <button
                onClick={() => setSelectedRfqForProposal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProposalSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  السعر المقترح (بالجنيه المصري EGP)
                </label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={proposalPrice}
                  onChange={(e) => setProposalPrice(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">مدة التنفيذ (أيام عمل)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={proposalDays}
                  onChange={(e) => setProposalDays(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">تفاصيل العرض ومنهجية العمل</label>
                <textarea
                  rows={3}
                  value={proposalNote}
                  onChange={(e) => setProposalNote(e.target.value)}
                  placeholder="وضح خبرتك السابقة في هذا التخصص والمخرجات الدقيقة التي ستسلمها للعميل..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRfqForProposal(null)}
                  className="px-4 py-2 text-xs text-slate-600 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  إرسال العرض للعميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Creating a New RFQ */}
      {isRFQModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">نشر طلب استشارة جديد وتلقّي العروض</h3>
              </div>
              <button
                onClick={() => setIsRFQModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">عنوان الطلب الاستشاري</label>
                <input
                  type="text"
                  value={rfqTitle}
                  onChange={(e) => setRfqTitle(e.target.value)}
                  placeholder="مثال: دراسة جدوى لمشروع صناعي، مراجعة فحص ضريبي..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">التخصص المطلوب</label>
                <select
                  value={rfqCategory}
                  onChange={(e) => setRfqCategory(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50 cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  شرح تفصيلي للمشكلة أو الاستشارة المطلوبة
                </label>
                <textarea
                  rows={4}
                  value={rfqDesc}
                  onChange={(e) => setRfqDesc(e.target.value)}
                  placeholder="اشرح بدقة ما تحتاجه، والوضع الحالي للشركة أو المشروع..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">الحد الأدنى للميزانية (ج.م)</label>
                  <input
                    type="number"
                    min="500"
                    step="100"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">الحد الأقصى للميزانية (ج.م)</label>
                  <input
                    type="number"
                    min="1000"
                    step="100"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">التاريخ المطلوب لإتمام الاستشارة</label>
                <input
                  type="date"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRFQModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  نشر الطلب الآن مجاناً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
