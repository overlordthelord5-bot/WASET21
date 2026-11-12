import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  HelpCircle,
  ShieldCheck,
  CreditCard,
  Calendar,
  Lock,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  CheckCircle,
} from 'lucide-react';

export const HelpCenter: React.FC = () => {
  const { supportTickets, currentUser } = useApp();
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('المدفوعات والحسابات');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const faqs = [
    {
      q: 'كيف تعمل منصة "وسيط" لحجز الاستشارات؟',
      a: 'تتيح لك منصة وسيط اكتشاف نخبة المستشارين المعتمدين في أكثر من 26 تخصصاً استشارياً في مصر. يمكنك فحص خبرات المستشار، شهاداته وتراخيصه الموثقة، واختيار الموعد المناسب لجدولك بتوقيت القاهرة. يتم الدفع بأمان بالجنيه المصري، وتُعقد الجلسة عبر قاعة فيديو مخصصة مشفرة، أو صوتياً أو كتابياً.',
    },
    {
      q: 'ما هو نظام الضمان المالي (Escrow) وكيف يحمي أموالي؟',
      a: 'عند حجز استشارة أو الموافقة على عرض سعر، لا يتم تحويل المبلغ للمستشار فوراً. بل يودع في حساب الضمان البنكي الآمن التابع لمنصة وسيط. لا يتم تحرير المستحقات للمستشار إلا بعد انعقاد الجلسة وتسليم المخرجات المتفق عليها ورضاك التام، مما يضمن حق الطرفين بنسبة 100%.',
    },
    {
      q: 'ما هي طرق الدفع المتاحة داخل مصر؟',
      a: 'تدعم المنصة جميع وسائل الدفع الإلكتروني الوطنية المصرية المعتمدة من البنك المركزي: بطاقات ميزة الوطنية، بطاقات الائتمان والخصم المباشر (Visa / Mastercard)، محافظ الهاتف الذكي مثل فودافون كاش وأورنج كاش واتصالات كاش، بالإضافة إلى الدفع بكود فوري من أي منفذ في جميع أنحاء الجمهورية.',
    },
    {
      q: 'كيف تضمن منصة وسيط كفاءة واعتماد المستشارين؟',
      a: 'لا يظهر أي مستشار بصفة "معتمد" إلا بعد تدقيق فريق وسيط في المستندات الرسمية: شهادات القيد بسجل المحاسبين والمراجعين، القيد بنقابة المحامين، تراخيص هيئة الرقابة المالية، الشهادات الدولية المعتمدة (PMP, CPA, CFA, AWS)، مع اشتراط خبرة مهنية موثقة في السوق المصري.',
    },
    {
      q: 'ماذا يحدث في حال تغيب المستشار أو حدوث نزاع؟',
      a: 'في حال عدم حضور المستشار في الموعد المحدد أو عدم تسليم مخرجات العمل المتفق عليها، يمكنك فوراً فتح نزاع من صفحة الحجز. يتدخل فريق الدعم لمراجعة وقائع الجلسة والمراسلات، وفي حال ثبوت التقصير يتم رد كامل المبلغ إلى حسابك أو محفظتك دون أي خصومات عبر قيد تسوية عكسي فوري.',
    },
    {
      q: 'كيف يمكنني نشر طلب عرض سعر (RFQ) بدلاً من حجز جلسة فورية؟',
      a: 'إذا كان لديك مشروع محدد (مثل تأسيس شركة، فحص ضريبي شامل، إعداد دراسة جدوى، أو برمجة تطبيق)، يمكنك الضغط على "طلب عرض سعر" وشرح متطلباتك وميزانيتك المقترحة. سيتلقى طلبك المستشارون المتخصصون ويقدمون عروض أسعار تنافسية بمدد التنفيذ لتختار الأنسب منها.',
    },
  ];

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    setTicketSuccess(true);
    setTicketSubject('');
    setTicketMessage('');
    setTimeout(() => setTicketSuccess(false), 5000);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-right space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>مركز المساعدة والدعم الفني</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          كيف يمكننا مساعدتك اليوم؟
        </h2>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          إجابات تفصيلية عن كل ما يخص حجز الاستشارات، نظام الضمان المالي، الدفع بالجنيه المصري، وحماية حقوقك.
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
          الأسئلة الأكثر شيوعاً
        </h3>
        {faqs.map((faq, idx) => {
          const isOpen = activeFaq === idx;
          return (
            <div
              key={idx}
              className="border border-slate-200 rounded-2xl overflow-hidden transition"
            >
              <button
                type="button"
                onClick={() => setActiveFaq(isOpen ? null : idx)}
                className="w-full p-4 text-right flex items-center justify-between font-bold text-xs sm:text-sm text-slate-900 bg-slate-50/70 hover:bg-slate-100 transition cursor-pointer"
              >
                <span>{faq.q}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className="p-4 text-xs text-slate-600 leading-relaxed bg-white border-t border-slate-100">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Support Ticket Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900">فتح تذكرة دعم فني جديدة</h3>
        </div>
        <p className="text-xs text-slate-600">
          إذا واجهت أي مشكلة أو كان لديك استفسار خاص، يرجى ملء النموذج وسيقوم فريق الدعم بالرد خلال دقائق معدودة.
        </p>

        {ticketSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 font-semibold">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>تم استلام تذكرتك بنجاح برقم #TKT-WAS-{Math.floor(1000 + Math.random() * 9000)}. سيتواصل معك فريق الدعم قريباً.</span>
          </div>
        )}

        <form onSubmit={handleTicketSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">موضوع التذكرة</label>
              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="مثال: استفسار عن تحرير الضمان لحجز #WAS..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">القسم المعني</label>
              <select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50 cursor-pointer"
              >
                <option value="المدفوعات والحسابات">المدفوعات وحساب الضمان (Escrow)</option>
                <option value="المواعيد والجلسات">المواعيد وقاعات الفيديو</option>
                <option value="اعتماد التراخيص">توثيق المستشارين والتراخيص</option>
                <option value="شكاوى ونزاعات">شكوى أو نزاع مالي</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">شرح المشكلة أو الاستفسار</label>
            <textarea
              rows={4}
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              placeholder="اكتب تفاصيل استفسارك ورقم الحجز إن وجد..."
              className="w-full text-xs p-3 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>إرسال التذكرة لفريق الدعم</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
