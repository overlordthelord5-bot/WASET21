import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Calendar,
  FileText,
  DollarSign,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  BookOpen,
  Activity,
  Award,
  Users,
  Settings,
  Download,
  CreditCard,
  MessageSquare,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Sliders,
  Share2,
  LifeBuoy,
  Send,
  Check,
  Copy,
  PlusCircle,
  Wallet,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { piastersToEgp } from '../../utils/ledger';
import { OrderWorkspace } from '../OrderWorkspace';

export const DashboardContainer: React.FC = () => {
  const {
    currentUser,
    bookings,
    orders,
    rfqs,
    consultants,
    categories,
    disputes,
    ledgerTransactions,
    auditLogs,
    supportTickets,
    supportingProducts,
    verifyConsultant,
    resolveDispute,
    platformFeePercent,
    setPlatformFeePercent,
    affiliateFeePercent,
    setAffiliateFeePercent,
    activeOrderWorkspaceId,
    setActiveOrderWorkspaceId,
    cancelBooking,
    completeBookingAndReleaseEscrow,
    createSupportTicket,
    replyToSupportTicket,
    updateTicketStatus,
    acceptRFQProposal,
    activeView,
    setActiveView,
    lang,
  } = useApp();

  const [adminTab, setAdminTab] = useState<
    'metrics' | 'verifications' | 'ledger' | 'disputes' | 'support' | 'affiliate' | 'audit' | 'settings'
  >('metrics');
  const [clientTab, setClientTab] = useState<'bookings' | 'orders' | 'rfqs' | 'support' | 'affiliate'>('bookings');
  const [consultantTab, setConsultantTab] = useState<'schedule' | 'orders' | 'earnings' | 'support' | 'affiliate'>('schedule');

  // Support ticket form state
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('المدفوعات والحسابات');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [ticketMessage, setTicketMessage] = useState('');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');

  // Affiliate link copy feedback
  const [copiedAffiliate, setCopiedAffiliate] = useState(false);

  // Consultant withdrawal simulator
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);

  // If viewing an active order workspace:
  if (activeOrderWorkspaceId) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <OrderWorkspace
          orderId={activeOrderWorkspaceId}
          onBack={() => {
            setActiveOrderWorkspaceId(null);
            if (activeView === 'workspace') {
              setActiveView('dashboard');
            }
          }}
        />
      </div>
    );
  }

  const handleCopyAffiliate = (code: string) => {
    const link = `https://waseet.eg/?ref=${code}`;
    navigator.clipboard?.writeText(link);
    setCopiedAffiliate(true);
    setTimeout(() => setCopiedAffiliate(false), 2500);
  };

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    createSupportTicket({
      subject: ticketSubject,
      category: ticketCategory,
      priority: ticketPriority,
      message: ticketMessage,
    });

    setIsTicketModalOpen(false);
    setTicketSubject('');
    setTicketMessage('');
  };

  const handleTicketReplySubmit = (ticketId: string) => {
    if (!ticketReplyText.trim()) return;
    replyToSupportTicket(ticketId, ticketReplyText);
    setTicketReplyText('');
  };

  // --- CLIENT DASHBOARD ---
  const renderClientDashboard = () => {
    const myBookings = bookings.filter((b) => b.clientId === currentUser.id);
    const myOrders = orders.filter((o) => o.clientId === currentUser.id);
    const myRfqs = rfqs.filter((r) => r.clientId === currentUser.id);
    const myTickets = supportTickets.filter((t) => t.userId === currentUser.id);
    const referralCode = `WAS-CLI-${currentUser.id.slice(-4).toUpperCase()}`;

    return (
      <div className="space-y-6 text-right">
        {/* Profile Card & Summary Stats */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{currentUser.name}</h2>
                <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-semibold border border-blue-200">
                  حساب عميل موثق
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                البريد: {currentUser.email} • الهاتف: {currentUser.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="text-center px-3 border-l border-slate-200 rtl:border-l-0 rtl:border-r">
              <span className="text-xs text-slate-500 block">الحجوزات النشطة</span>
              <span className="text-base font-extrabold text-blue-700">{myBookings.length}</span>
            </div>
            <div className="text-center px-3 border-l border-slate-200 rtl:border-l-0 rtl:border-r">
              <span className="text-xs text-slate-500 block">طلبات العمل</span>
              <span className="text-base font-extrabold text-slate-800">{myOrders.length}</span>
            </div>
            <div className="text-center px-3 border-l border-slate-200 rtl:border-l-0 rtl:border-r">
              <span className="text-xs text-slate-500 block">عروض RFQ</span>
              <span className="text-base font-extrabold text-slate-800">{myRfqs.length}</span>
            </div>
            <div className="text-center px-3">
              <span className="text-xs text-slate-500 block">تذاكر الدعم</span>
              <span className="text-base font-extrabold text-teal-700">{myTickets.length}</span>
            </div>
          </div>
        </div>

        {/* Client Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 text-xs">
          {[
            { id: 'bookings', label: `جلسات الاستشارة والحجوزات (${myBookings.length})` },
            { id: 'orders', label: `مساحة العمل والمخرجات (${myOrders.length})` },
            { id: 'rfqs', label: `طلبات عروض الأسعار RFQ (${myRfqs.length})` },
            { id: 'support', label: `تذاكر الدعم الفني والمساعدة (${myTickets.length})` },
            { id: 'affiliate', label: `برنامج التسويق بالعمولة (8%)` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setClientTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
                clientTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bookings View */}
        {clientTab === 'bookings' && (
          <div className="space-y-4">
            {myBookings.length > 0 ? (
              myBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {b.bookingNumber}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : b.status === 'completed'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {b.status === 'confirmed'
                          ? 'مؤكد ومحجوز'
                          : b.status === 'completed'
                          ? 'مكتمل'
                          : b.status === 'cancelled'
                          ? 'ملغى ومسترد'
                          : b.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{b.serviceTitle}</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      المستشار: <strong className="text-slate-800">{b.consultantName}</strong> • الموعد:{' '}
                      {new Date(b.scheduledAt).toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'short' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-left">
                      <span className="text-sm font-black text-slate-900 block">
                        {b.priceEgp.toLocaleString('ar-EG')} ج.م
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold block">
                        {b.isEscrowHeld ? 'محفوظ بحساب الضمان' : 'محرر'}
                      </span>
                    </div>

                    {b.status === 'confirmed' && (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={b.meetingUrl || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                        >
                          دخول قاعة الاجتماع
                        </a>
                        <button
                          onClick={() => cancelBooking(b.id, 'طلب إلغاء من العميل')}
                          className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          إلغاء واسترداد
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                لا توجد حجوزات استشارية نشطة حالياً.
              </div>
            )}
          </div>
        )}

        {/* Orders View */}
        {clientTab === 'orders' && (
          <div className="space-y-4">
            {myOrders.length > 0 ? (
              myOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-700">{ord.orderNumber}</span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">{ord.serviceTitle}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      المستشار: {ord.consultantName} • المخرجات المسلمة: {ord.deliverables.length} • القيمة:{' '}
                      <strong className="text-slate-800">{ord.amountEgp.toLocaleString('ar-EG')} ج.م</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveOrderWorkspaceId(ord.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <span>فتح مساحة العمل والمخرجات</span>
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                لا توجد طلبات عمل ومخرجات نشطة.
              </div>
            )}
          </div>
        )}

        {/* RFQs View */}
        {clientTab === 'rfqs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">طلبات عروض الأسعار المنشورة من طرفك</h3>
              <button
                onClick={() => setActiveView('rfq')}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>نشر طلب جديد</span>
              </button>
            </div>
            {myRfqs.map((rfq) => (
              <div key={rfq.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
                    {rfq.rfqNumber}
                  </span>
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    {rfq.status === 'open' ? 'مفتوح لتلقي العروض' : 'تم اختيار العرض'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{rfq.title}</h4>
                <p className="text-xs text-slate-600">{rfq.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">
                    العروض المقدمة: <strong className="text-blue-700">{rfq.proposals.length}</strong>
                  </span>
                  <button
                    onClick={() => setActiveView('rfq')}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    عرض العروض ومقارنة الأسعار ←
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Support Tickets View */}
        {clientTab === 'support' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">تذاكر الدعم الفني والاستفسارات</h3>
                <p className="text-xs text-slate-500">فريق خدمة عملاء وسيط في القاهرة متاح على مدار 24 ساعة.</p>
              </div>
              <button
                onClick={() => setIsTicketModalOpen(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <LifeBuoy className="w-4 h-4" />
                <span>فتح تذكرة دعم جديدة</span>
              </button>
            </div>

            {myTickets.length > 0 ? (
              <div className="space-y-3">
                {myTickets.map((t) => (
                  <div key={t.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                          {t.ticketNumber}
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{t.category}</span>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          t.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : t.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {t.status === 'resolved' ? 'تم الحل' : t.status === 'in_progress' ? 'قيد المعالجة' : 'مفتوحة'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{t.subject}</h4>

                    {/* Messages Thread */}
                    <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      {t.messages.map((m, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl text-xs ${
                            m.senderRole === 'support' || m.senderRole === 'admin'
                              ? 'bg-teal-50 text-teal-900 border border-teal-100'
                              : 'bg-white text-slate-800 border border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold">{m.senderName}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(m.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed">{m.content}</p>
                        </div>
                      ))}
                    </div>

                    {/* Reply Form */}
                    {t.status !== 'closed' && (
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <input
                          type="text"
                          value={activeTicketId === t.id ? ticketReplyText : ''}
                          onFocus={() => setActiveTicketId(t.id)}
                          onChange={(e) => {
                            setActiveTicketId(t.id);
                            setTicketReplyText(e.target.value);
                          }}
                          placeholder="اكتب ردك أو استفسارك هنا..."
                          className="flex-1 text-xs p-2.5 border border-slate-200 rounded-xl"
                        />
                        <button
                          onClick={() => handleTicketReplySubmit(t.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                لا توجد تذاكر دعم فني مفتوحة حالياً.
              </div>
            )}
          </div>
        )}

        {/* Affiliate Program View */}
        {clientTab === 'affiliate' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 shadow-md">
              <div className="max-w-xl">
                <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-bold mb-3 inline-block">
                  برنامج شركاء النجاح والتسويق بالعمولة (Affiliate Program)
                </span>
                <h3 className="text-xl sm:text-2xl font-black">اربح 8% عمولة نقدية على كل استشارة يتم حجزها عبر رابطك</h3>
                <p className="text-xs sm:text-sm text-blue-100 mt-2 leading-relaxed">
                  شارك رابط الإحالة الخاص بك مع أصحاب الشركات ورواد الأعمال. عند إتمام أول جلسة استشارية ناجحة، يتم إضافة
                  العمولة فوراً لحسابك مع إمكانية السحب المباشر عبر المحافظ الإلكترونية المصرية.
                </p>
              </div>

              {/* Referral Link Box */}
              <div className="mt-6 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-right w-full sm:w-auto">
                  <span className="text-[11px] text-blue-200 block">رابط الإحالة الخاص بك:</span>
                  <span className="text-xs sm:text-sm font-mono font-bold text-white break-all">
                    https://waseet.eg/?ref={referralCode}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyAffiliate(referralCode)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copiedAffiliate ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>تم نسخ الرابط!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>نسخ الرابط</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Affiliate KPI Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium block">إجمالي الزيارات المسجلة</span>
                <span className="text-xl font-black text-slate-900 block mt-1">142 زيارة</span>
                <span className="text-[10px] text-blue-600 font-semibold block mt-1">من خلال رابط الإحالة</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium block">العملاء المشتركون</span>
                <span className="text-xl font-black text-blue-700 block mt-1">14 عميلاً</span>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-1">حسابات نشطة ومحققة</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium block">الاستشارات المكتملة</span>
                <span className="text-xl font-black text-emerald-700 block mt-1">6 جلسات</span>
                <span className="text-[10px] text-slate-500 font-semibold block mt-1">تم تسويتها بالدفتر</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium block">إجمالي العمولات المكتسبة</span>
                <span className="text-xl font-black text-teal-700 block mt-1">1,840 ج.م</span>
                <span className="text-[10px] text-teal-600 font-semibold block mt-1">متاح للسحب: 720 ج.م</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- CONSULTANT DASHBOARD ---
  const renderConsultantDashboard = () => {
    const consultant = consultants[0];
    const incomingBookings = bookings.filter((b) => b.consultantId === consultant.id);
    const consultantOrders = orders.filter((o) => o.consultantId === consultant.id);
    const totalEarnedEgp = incomingBookings
      .filter((b) => b.status === 'completed')
      .reduce((acc, curr) => acc + curr.netConsultantEgp, 0);
    const escrowHeldEgp = incomingBookings
      .filter((b) => b.isEscrowHeld)
      .reduce((acc, curr) => acc + curr.netConsultantEgp, 0);

    const consultantTickets = supportTickets.filter((t) => t.userId === currentUser.id);
    const consultantReferralCode = `WAS-PRO-${consultant.id.slice(-4).toUpperCase()}`;

    return (
      <div className="space-y-6 text-right">
        {/* Consultant Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={consultant.avatar}
              alt={consultant.nameAr}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{consultant.nameAr}</h2>
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  مستشار معتمد رسمياً
                </span>
              </div>
              <p className="text-xs text-blue-700 font-medium mt-0.5">{consultant.titleAr}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="text-center px-3 border-l border-slate-200 rtl:border-l-0 rtl:border-r">
              <span className="text-xs text-slate-500 block">الرصيد المتاح للسحب</span>
              <span className="text-base font-black text-emerald-700">{totalEarnedEgp.toLocaleString('ar-EG')} ج.م</span>
            </div>
            <div className="text-center px-3">
              <span className="text-xs text-slate-500 block">رصيد معلق تحت الضمان</span>
              <span className="text-base font-black text-blue-700">{escrowHeldEgp.toLocaleString('ar-EG')} ج.م</span>
            </div>
          </div>
        </div>

        {/* Consultant Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 text-xs">
          {[
            { id: 'schedule', label: `جدول الجلسات القادمة (${incomingBookings.length})` },
            { id: 'orders', label: `طلبات العمل والمخرجات (${consultantOrders.length})` },
            { id: 'earnings', label: `الأرباح والمحفظة وسحب الرصيد` },
            { id: 'support', label: `الدعم الفني للمستشارين (${consultantTickets.length})` },
            { id: 'affiliate', label: `التسويق بالعمولة (8%)` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setConsultantTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
                consultantTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Schedule View */}
        {consultantTab === 'schedule' && (
          <div className="space-y-4">
            {incomingBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {b.bookingNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      العميل: {b.clientName}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{b.serviceTitle}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    الموعد: {new Date(b.scheduledAt).toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'short' })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <span className="text-xs text-slate-400 block">صافي مستحقاتك (85%):</span>
                    <span className="text-sm font-black text-emerald-700">
                      {b.netConsultantEgp.toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>

                  <a
                    href={b.meetingUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    بدء الجلسة
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Orders View */}
        {consultantTab === 'orders' && (
          <div className="space-y-4">
            {consultantOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div>
                  <span className="text-xs font-mono font-bold text-blue-700">{ord.orderNumber}</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">{ord.serviceTitle}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    العميل: {ord.clientName} • عدد الملفات المسلمة: {ord.deliverables.length}
                  </p>
                </div>
                <button
                  onClick={() => setActiveOrderWorkspaceId(ord.id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <span>تسليم المخرجات ومتابعة العمل</span>
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Earnings & Wallet View */}
        {consultantTab === 'earnings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium block">إجمالي المبيعات المحققة</span>
                <span className="text-xl font-black text-slate-900 block mt-1">
                  {(totalEarnedEgp + escrowHeldEgp).toLocaleString('ar-EG')} ج.م
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">قبل خصم عمولة المنصة (15%)</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium block">الرصيد المتاح للسحب الفوري</span>
                <span className="text-xl font-black text-emerald-700 block mt-1">
                  {totalEarnedEgp.toLocaleString('ar-EG')} ج.م
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
                  محصن ومعتمد بالدفتر المحاسبي
                </span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium block">المعلق تحت الضمان (Escrow)</span>
                <span className="text-xl font-black text-blue-700 block mt-1">
                  {escrowHeldEgp.toLocaleString('ar-EG')} ج.م
                </span>
                <span className="text-[10px] text-blue-600 font-semibold block mt-1">
                  يحرر فور اعتماد العميل للمخرج
                </span>
              </div>
            </div>

            {/* Payout Request Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">سحب الأرباح إلى الحساب البنكي المصري أو المحفظة الإلكترونية</h3>
              <p className="text-xs text-slate-600">
                تدعم منصة وسيط التحويل الفوري عبر شبكة المدفوعات اللحظية المصرية (IPN / InstaPay) أو المحافظ الذكية (فودافون كاش، أورنج كاش، وي باي، إي آند كاش) أو الحسابات البنكية لدى البنك الأهلي المصري وبنك مصر وبنك CIB.
              </p>

              {payoutSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                  {payoutSuccessMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">طريقة السحب المفضلة</label>
                  <select className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50">
                    <option>إنستاباي InstaPay / رقم الهاتف المسجل</option>
                    <option>محفظة فودافون كاش الذكية (010)</option>
                    <option>تحويل بنكي IBAN (البنك الأهلي المصري)</option>
                    <option>تحويل بنكي IBAN (بنك مصر)</option>
                    <option>تحويل بنكي IBAN (البنك التجاري الدولي CIB)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">المبلغ المطلوب سحبه (ج.م)</label>
                  <input
                    type="number"
                    defaultValue={totalEarnedEgp}
                    max={totalEarnedEgp}
                    min={100}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    setPayoutSuccessMsg('تم تقديم طلب التحويل بنجاح! سيتم إيداع المبلغ خلال ساعتين عمل عبر إنستاباي.');
                    setTimeout(() => setPayoutSuccessMsg(null), 5000);
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Wallet className="w-4 h-4" />
                  <span>تأكيد طلب سحب الأرباح الآن</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Support Tickets View */}
        {consultantTab === 'support' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">مكتب دعم المستشارين</h3>
                <p className="text-xs text-slate-500">مساعدة مخصصة لتسوية النزاعات، التحقق، وتنسيق المدفوعات.</p>
              </div>
              <button
                onClick={() => setIsTicketModalOpen(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <LifeBuoy className="w-4 h-4" />
                <span>فتح تذكرة دعم جديدة</span>
              </button>
            </div>

            {consultantTickets.length > 0 ? (
              <div className="space-y-3">
                {consultantTickets.map((t) => (
                  <div key={t.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-teal-700">{t.ticketNumber}</span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {t.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{t.subject}</h4>
                    <p className="text-xs text-slate-600">{t.messages[0]?.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                لا توجد تذاكر دعم فني نشطة حالياً.
              </div>
            )}
          </div>
        )}

        {/* Affiliate View */}
        {consultantTab === 'affiliate' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">رابط الإحالة المباشر للمستشار</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  احصل على عمولة 8% إضافية عند دعوة عملاء جدد لحجز استشاراتك أو استشارات زملائك بالمنصة.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-xl">
                كود الإحالة: {consultantReferralCode}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="font-mono text-xs text-slate-700 flex-1 truncate">
                https://waseet.eg/?ref={consultantReferralCode}
              </span>
              <button
                onClick={() => handleCopyAffiliate(consultantReferralCode)}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                {copiedAffiliate ? 'تم النسخ!' : 'نسخ'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- ADMIN DASHBOARD ---
  const renderAdminDashboard = () => {
    const grossBookingsPiasters = ledgerTransactions
      .filter((tx) => tx.referenceType === 'booking')
      .reduce((acc, tx) => acc + tx.totalDebitsPiasters, 0);

    const grossBookingsEgp = piastersToEgp(grossBookingsPiasters);
    const platformRevenueEgp = Math.round(grossBookingsEgp * (platformFeePercent / 100));

    return (
      <div className="space-y-6 text-right">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium block">إجمالي المعاملات المحصلة (EGP)</span>
            <span className="text-xl font-black text-slate-900 block mt-1">
              {grossBookingsEgp.toLocaleString('ar-EG')} ج.م
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
              عبر بوابات الدفع الوطنية
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium block">إيرادات عمولة وسيط ({platformFeePercent}%)</span>
            <span className="text-xl font-black text-blue-700 block mt-1">
              {platformRevenueEgp.toLocaleString('ar-EG')} ج.م
            </span>
            <span className="text-[10px] text-blue-600 font-semibold block mt-1">
              قيد محاسبي معتمد بالدفتر
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium block">أموال تحت الضمان (Escrow)</span>
            <span className="text-xl font-black text-emerald-700 block mt-1">
              {(grossBookingsEgp - platformRevenueEgp).toLocaleString('ar-EG')} ج.م
            </span>
            <span className="text-[10px] text-slate-500 font-semibold block mt-1">
              حساب 1010-ESCROW-FUNDS
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium block">المستشارون المعتمدون</span>
            <span className="text-xl font-black text-purple-700 block mt-1">
              {consultants.length} مستشاراً
            </span>
            <span className="text-[10px] text-purple-600 font-semibold block mt-1">
              في 26+ تخصصاً استشارياً
            </span>
          </div>
        </div>

        {/* Admin Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 text-xs">
          {[
            { id: 'metrics', label: 'المؤشرات والعمليات' },
            { id: 'verifications', label: `طلبات اعتماد المستشارين (${consultants.length})` },
            { id: 'ledger', label: `دفتر الأستاذ العام القيد المزدوج (${ledgerTransactions.length})` },
            { id: 'disputes', label: `إدارة النزاعات والتسويات (${disputes.length})` },
            { id: 'support', label: `تذاكر الدعم وخدمة العملاء (${supportTickets.length})` },
            { id: 'affiliate', label: 'برنامج التسويق بالعمولة' },
            { id: 'audit', label: `سجل التدقيق الأمني Audit Logs (${auditLogs.length})` },
            { id: 'settings', label: 'إعدادات المنصة والعمولات' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
                adminTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Verifications Queue */}
        {adminTab === 'verifications' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">قائمة المستشارين والتراخيص المقدمة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {consultants.map((c) => (
                <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={c.avatar} alt={c.nameAr} className="w-12 h-12 rounded-xl object-cover" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{c.nameAr}</h4>
                        <span className="text-[11px] text-blue-700">{c.titleAr}</span>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        c.verificationStatus === 'verified'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {c.verificationStatus === 'verified' ? 'معتمد' : 'قيد المراجعة'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                    <span className="font-semibold text-slate-600 block">التراخيص والشهادات المرفقة:</span>
                    {c.certifications.map((cert, idx) => (
                      <div key={idx} className="text-slate-700 text-[11px] flex justify-between">
                        <span>{cert.title}</span>
                        <span className="font-mono text-blue-600">{cert.licenseNumber}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => verifyConsultant(c.id, false, 'مطلوب استكمال بيانات ترخيص القيد')}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      رفض أو طلب مستندات
                    </button>
                    <button
                      onClick={() => verifyConsultant(c.id, true, 'تم التحقق من القيد بسجل المراجعين')}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      اعتماد المستشار وتفعيل الشارة
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Double-Entry Ledger Transactions */}
        {adminTab === 'ledger' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  دفتر الأستاذ العام للقيود المزدوجة (Double-Entry General Ledger)
                </h3>
                <p className="text-xs text-slate-500">
                  جميع العمليات تسجل بقيدين متوازنين (Total Debits = Total Credits) بوحدة القروش منعاً لأي خطأ محاسبي.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {ledgerTransactions.map((tx) => (
                <div key={tx.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {tx.id}
                      </span>
                      <p className="text-xs text-slate-800 font-semibold mt-1">{tx.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        ✓ متوازن ومطابق محاسبياً
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(tx.date).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </div>

                  {/* Entries Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">رقم الحساب</th>
                          <th className="py-2 px-3">اسم الحساب في الدليل</th>
                          <th className="py-2 px-3 text-left">مدين (Debit - قروش)</th>
                          <th className="py-2 px-3 text-left">دائن (Credit - قروش)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tx.entries.map((entry, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-mono text-slate-600">{entry.accountCode}</td>
                            <td className="py-2 px-3 font-medium text-slate-800">{entry.accountName}</td>
                            <td className="py-2 px-3 text-left font-mono font-bold text-blue-700">
                              {entry.debitPiasters > 0 ? entry.debitPiasters.toLocaleString() : '-'}
                            </td>
                            <td className="py-2 px-3 text-left font-mono font-bold text-emerald-700">
                              {entry.creditPiasters > 0 ? entry.creditPiasters.toLocaleString() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t-2 border-slate-200 font-black">
                        <tr>
                          <td colSpan={2} className="py-2 px-3 text-slate-700">
                            الإجمالي المتوازن (المجموع):
                          </td>
                          <td className="py-2 px-3 text-left font-mono text-blue-800">
                            {tx.totalDebitsPiasters.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-left font-mono text-emerald-800">
                            {tx.totalCreditsPiasters.toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Support Tickets Management */}
        {adminTab === 'support' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">إدارة تذاكر الدعم الفني واستفسارات المستخدمين</h3>
            <div className="space-y-3">
              {supportTickets.map((ticket) => (
                <div key={ticket.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {ticket.ticketNumber}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">المرسل: {ticket.userName}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{ticket.category}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={ticket.status}
                        onChange={(e) => updateTicketStatus(ticket.id, e.target.value as any)}
                        className="text-xs p-1.5 border border-slate-200 rounded-lg bg-slate-50 font-bold"
                      >
                        <option value="open">مفتوحة</option>
                        <option value="in_progress">قيد المعالجة</option>
                        <option value="resolved">تم الحل</option>
                        <option value="closed">مغلقة</option>
                      </select>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{ticket.subject}</h4>

                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    {ticket.messages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl text-xs ${
                          m.senderRole === 'support' || m.senderRole === 'admin'
                            ? 'bg-teal-50 text-teal-900 border border-teal-100'
                            : 'bg-white text-slate-800 border border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold">{m.senderName} ({m.senderRole})</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(m.timestamp).toLocaleTimeString('ar-EG')}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed">{m.content}</p>
                      </div>
                    ))}
                  </div>

                  {/* Admin Reply Box */}
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      value={activeTicketId === ticket.id ? ticketReplyText : ''}
                      onFocus={() => setActiveTicketId(ticket.id)}
                      onChange={(e) => {
                        setActiveTicketId(ticket.id);
                        setTicketReplyText(e.target.value);
                      }}
                      placeholder="كتابة رد الدعم الفني الرسمي للمستخدم..."
                      className="flex-1 text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                    <button
                      onClick={() => handleTicketReplySubmit(ticket.id)}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال الرد</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Affiliate Program Settings & Oversight */}
        {adminTab === 'affiliate' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-2xl space-y-4">
              <h3 className="text-sm font-bold text-slate-800">إدارة برنامج التسويق بالعمولة وسقف الأرباح</h3>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  نسبة عمولة الإحالة والتسويق (Affiliate Commission %)
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={affiliateFeePercent}
                  onChange={(e) => setAffiliateFeePercent(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  تخصم لصالح المسوق بالعمولة عند إتمام الحجز وسداد قيمة الاستشارة بنجاح.
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-2 border border-slate-100">
                <span className="font-bold text-slate-700 block">شروط الاستحقاق ومكافحة الاحتيال:</span>
                <p className="text-slate-600 leading-relaxed">
                  • تمنع المنصة الإحالة الذاتية (Self-referral) عبر فحص رقم الهاتف الوطني وعنوان IP وجهاز المستخدم.
                  <br />
                  • لا تصرف العمولات إلا بعد اكتمال الجلسة الاستشارية ومضي 48 ساعة دون وجود نزاع مفتوح.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Audit Logs */}
        {adminTab === 'audit' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">سجل التدقيق الأمني (Security Audit Trail)</h3>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">نوع العملية</th>
                    <th className="py-3 px-4">المستخدم</th>
                    <th className="py-3 px-4">الدور</th>
                    <th className="py-3 px-4">التفاصيل</th>
                    <th className="py-3 px-4">عنوان IP</th>
                    <th className="py-3 px-4">التوقيت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-700">{log.action}</td>
                      <td className="py-2.5 px-4 text-slate-800">{log.userId}</td>
                      <td className="py-2.5 px-4">
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">{log.userRole}</span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate">{log.details}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-400">{log.ipAddress}</td>
                      <td className="py-2.5 px-4 text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString('ar-EG')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: Platform Settings & Commissions */}
        {adminTab === 'settings' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs max-w-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800">إعدادات العمولات والوساطة</h3>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                نسبة عمولة منصة وسيط الافتراضية (%)
              </label>
              <input
                type="number"
                min="5"
                max="30"
                value={platformFeePercent}
                onChange={(e) => setPlatformFeePercent(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                تطبق على المعاملات الجديدة وتودع في حساب 4010-PLATFORM-COMMISSION-EARNED.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                نسبة عمولة الإحالة والتسويق (Affiliate %)
              </label>
              <input
                type="number"
                min="0"
                max="15"
                value={affiliateFeePercent}
                onChange={(e) => setAffiliateFeePercent(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                تخصم لصالح المسوق بالعمولة عند إتمام الدفع بنجاح.
              </span>
            </div>
          </div>
        )}

        {/* Tab 7: Disputes */}
        {adminTab === 'disputes' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">قائمة النزاعات المفتوحة</h3>
            {disputes.length > 0 ? (
              disputes.map((d) => (
                <div key={d.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded">
                      {d.disputeNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{d.status}</span>
                  </div>
                  <p className="text-xs text-slate-800">{d.reason}</p>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => resolveDispute(d.id, 'refund_client', 'تسوية كاملة وإعادة المبلغ للعميل')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      استرداد كامل للعميل
                    </button>
                    <button
                      onClick={() => resolveDispute(d.id, 'pay_consultant', 'اعتماد الخدمة وصرف المستحقات للمستشار')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      تحرير المستحقات للمستشار
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                لا توجد نزاعات معلقة حالياً في المنصة.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {currentUser.role === 'admin'
        ? renderAdminDashboard()
        : currentUser.role === 'consultant'
        ? renderConsultantDashboard()
        : renderClientDashboard()}

      {/* Modal: New Support Ticket */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">فتح تذكرة دعم فني جديدة</h3>
              </div>
              <button
                onClick={() => setIsTicketModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">موضوع التذكرة</label>
                <input
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="مثال: استفسار عن تحويل الأموال عبر فودافون كاش..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">تصنيف المشكلة</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50 cursor-pointer"
                  >
                    <option>المدفوعات والحسابات</option>
                    <option>حجوزات الجلسات</option>
                    <option>توثيق الحساب والشهادات</option>
                    <option>الشكاوى والنزاعات</option>
                    <option>أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">الأولوية</label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50 cursor-pointer"
                  >
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">مرتفعة</option>
                    <option value="urgent">عاجلة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">شرح المشكلة أو الاستفسار</label>
                <textarea
                  rows={4}
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="اشرح المشكلة بالتفصيل وأرفق أي أرقام عمليات متعلقة..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 cursor-pointer"
                >
                  إرسال التذكرة للفريق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
