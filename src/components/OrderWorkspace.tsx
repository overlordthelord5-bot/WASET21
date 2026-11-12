import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Send,
  MessageSquare,
  ShieldCheck,
  Clock,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
} from 'lucide-react';

export const OrderWorkspace: React.FC<{
  orderId: string;
  onBack: () => void;
}> = ({ orderId, onBack }) => {
  const {
    orders,
    currentUser,
    submitDeliverable,
    requestOrderRevision,
    completeBookingAndReleaseEscrow,
    openDispute,
    messages,
    sendMessage,
    lang,
  } = useApp();

  const order = orders.find((o) => o.id === orderId);

  // Deliverable upload form state
  const [isUploading, setIsUploading] = useState(false);
  const [deliverableTitle, setDeliverableTitle] = useState('');
  const [deliverableDesc, setDeliverableDesc] = useState('');

  // Revision request form state
  const [isRequestingRevision, setIsRequestingRevision] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');

  // Dispute form state
  const [isOpeningDispute, setIsOpeningDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  // Chat message state
  const [chatInput, setChatInput] = useState('');

  if (!order) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600">طلب العمل غير موجود.</p>
        <button onClick={onBack} className="mt-3 text-blue-600 text-xs font-bold hover:underline">
          العودة
        </button>
      </div>
    );
  }

  const isClient = currentUser.id === order.clientId;
  const isConsultant = currentUser.id === order.consultantId || currentUser.role === 'consultant';
  const isAdmin = currentUser.role === 'admin';

  // Workspace Messages
  const conversationId = `conv-${order.bookingId}`;
  const orderMessages = messages.filter((m) => m.conversationId === conversationId);

  const handleDeliverableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverableTitle.trim()) return;
    submitDeliverable(order.id, deliverableTitle, deliverableDesc);
    setIsUploading(false);
    setDeliverableTitle('');
    setDeliverableDesc('');
  };

  const handleRevisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNote.trim()) return;
    requestOrderRevision(order.id, revisionNote);
    setIsRequestingRevision(false);
    setRevisionNote('');
  };

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    openDispute(order.bookingId, disputeReason);
    setIsOpeningDispute(false);
    setDisputeReason('');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const recipientId = isClient ? order.consultantId : order.clientId;
    sendMessage(conversationId, recipientId, chatInput);
    setChatInput('');
  };

  return (
    <div className="space-y-6 text-right">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
        >
          {lang === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>العودة لقائمة الطلبات</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-200">
            {order.orderNumber}
          </span>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              order.status === 'completed'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : order.status === 'disputed'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {order.status === 'completed'
              ? 'مكتمل ومحرر'
              : order.status === 'disputed'
              ? 'تحت النزاع'
              : order.status === 'deliverable_submitted'
              ? 'تم تسليم المخرجات للمراجعة'
              : order.status === 'revision_requested'
              ? 'طلب تعديل قيد التنفيذ'
              : 'جاري التنفيذ النشط'}
          </span>
        </div>
      </div>

      {/* Main Order Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">{order.serviceTitle}</h2>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
            <span>العميل: <strong className="text-slate-800">{order.clientName}</strong></span>
            <span>•</span>
            <span>المستشار: <strong className="text-slate-800">{order.consultantName}</strong></span>
            <span>•</span>
            <span>تاريخ البدء: {new Date(order.createdAt).toLocaleDateString('ar-EG')}</span>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left shrink-0">
          <span className="text-xs text-slate-500 block">إجمالي قيمة الصفقة (الضمان Escrow):</span>
          <span className="text-xl font-black text-blue-700 block">
            {order.amountEgp.toLocaleString('ar-EG')} ج.م
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 justify-end mt-0.5">
            <ShieldCheck className="w-3 h-3" />
            محفوظة بحساب الضمان
          </span>
        </div>
      </div>

      {/* Grid: Deliverables Workspace & Live Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Deliverables & Workflow Actions (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deliverables Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">مخرجات العمل والملفات المسلمة</h3>
              </div>

              {isConsultant && order.status !== 'completed' && (
                <button
                  onClick={() => setIsUploading(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>تسليم ملف أو مخرج</span>
                </button>
              )}
            </div>

            {order.deliverables.length > 0 ? (
              <div className="space-y-3">
                {order.deliverables.map((del) => (
                  <div
                    key={del.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{del.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{del.description}</p>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          تم التسليم في: {new Date(del.submittedAt).toLocaleString('ar-EG')}
                        </span>
                      </div>
                    </div>

                    <a
                      href={del.fileUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-blue-600 flex items-center gap-1 shadow-2xs shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل</span>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                لم يتم رفع مخرجات نهائية حتى الآن. يستطيع المستشار رفع الملفات وتقارير العمل من هنا.
              </div>
            )}

            {/* Revision Requests History */}
            {order.revisionRequests.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-amber-800 block">طلبات التعديل السابقة:</span>
                {order.revisionRequests.map((rev, idx) => (
                  <div key={idx} className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                    طلب {idx + 1}: {rev}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client Decision Bar (Release Escrow or Request Revision) */}
          {order.status !== 'completed' && order.status !== 'disputed' && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900">قرارات وإجراءات استكمال الطلب</h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  بمجرد اعتماد المخرجات، سيتم تحرير أموال الضمان ونقلها إلى رصيد المستشار.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isClient && (
                  <>
                    <button
                      onClick={() => setIsRequestingRevision(true)}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      طلب تعديل
                    </button>
                    <button
                      onClick={() => completeBookingAndReleaseEscrow(order.bookingId)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>اعتماد المخرجات وتحرير الضمان</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsOpeningDispute(true)}
                  className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  فتح نزاع
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Internal Chat & Messages */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col h-[520px]">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900">المحادثة الداخلية الموثقة للطلب</h3>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-3 p-1">
            {orderMessages.length > 0 ? (
              orderMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}
                  >
                    <span className="text-[10px] text-slate-400 mb-0.5">
                      {msg.senderName} ({msg.senderRole})
                    </span>
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-tr-xs'
                          : 'bg-slate-100 text-slate-800 rounded-tl-xs'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5">
                      {new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 text-xs text-slate-400">
                لا توجد رسائل سابقة. ابدأ المحادثة المباشرة مع المستشار هنا.
              </div>
            )}
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="اكتب رسالتك للمستشار هنا..."
              className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer shrink-0"
              aria-label="إرسال"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Upload Deliverable Modal */}
      {isUploading && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">تسليم مخرج عمل جديد للعميل</h3>
              <button onClick={() => setIsUploading(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDeliverableSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">عنوان المخرج أو التقرير</label>
                <input
                  type="text"
                  value={deliverableTitle}
                  onChange={(e) => setDeliverableTitle(e.target.value)}
                  placeholder="مثال: تقرير الفحص الضريبي النهائي، مسودة عقد التأسيس..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">وصف المخرج وتوجيهات للعميل</label>
                <textarea
                  rows={3}
                  value={deliverableDesc}
                  onChange={(e) => setDeliverableDesc(e.target.value)}
                  placeholder="اكتب تفاصيل التقرير والخطوات التالية المطلوبة من العميل..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploading(false)}
                  className="px-4 py-2 text-xs text-slate-600"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  تأكيد التسليم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revision Request Modal */}
      {isRequestingRevision && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">طلب تعديل على المخرجات</h3>
              <button onClick={() => setIsRequestingRevision(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRevisionSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ما هي النقاط التي ترغب في تعديلها أو استيضاحها؟
                </label>
                <textarea
                  rows={4}
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="حدد بدقة التعديلات المطلوبة وفقاً لنطاق العمل المتفق عليه..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRequestingRevision(false)}
                  className="px-4 py-2 text-xs text-slate-600"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold"
                >
                  إرسال طلب التعديل للمستشار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {isOpeningDispute && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">فتح نزاع رسمي وإيقاف تحرير الضمان</h3>
              </div>
              <button onClick={() => setIsOpeningDispute(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              عند فتح النزاع، سيتدخل فريق دعم وسيط لمراجعة تسجيل الجلسة والمراسلات والملفات المقدمة والفصل العادل بين الطرفين.
            </p>
            <form onSubmit={handleDisputeSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">سبب النزاع والتفاصيل</label>
                <textarea
                  rows={4}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="اشرح المشكلة بالتفصيل (عدم حضور الجلسة، عدم تسليم المخرجات المتفق عليها...)"
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpeningDispute(false)}
                  className="px-4 py-2 text-xs text-slate-600"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                >
                  تأكيد فتح النزاع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
