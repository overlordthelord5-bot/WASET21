import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Bot,
  Send,
  Sparkles,
  ShieldAlert,
  ArrowLeft,
  Users,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';

interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
}

export const AIAssistantModal: React.FC = () => {
  const { isAIModalOpen, setIsAIModalOpen, setActiveView, setIsRFQModalOpen, lang } = useApp();

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: `مرحباً بك! أنا مساعد منصة "وسيط" الذكي. 
أستطيع مساعدتك في تحديد التخصص الاستشاري الأنسب لاحتياجك، وصياغة استفساراتك أو طلبات عروض الأسعار (RFQ) بدقة، وتوجيهك لأفضل الخبراء المعتمدين في مصر.

كيف يمكنني مساعدتك اليوم؟`,
    },
  ]);

  if (!isAIModalOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userQuery: textToSend }),
      });

      if (!response.ok) {
        throw new Error('Server returned error');
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: data.reply || 'نوصي بالاطلاع على دليل المستشارين المعتمدين في منصة وسيط لمقابلة الخبير المناسب.',
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'يسعدنا مساعدتك في اختيار التخصص المناسب. بناءً على استفسارك، نوصي باستعراض قسم **الضرائب وتأسيس الشركات والاستشارات المالية** في دليل المستشارين.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleChips = [
    'أريد تأسيس شركة بالهيئة العامة للاستثمار (GAFI)',
    'لدي مشكلة في الفاتورة الإلكترونية والفحص الضريبي',
    'أحتاج دراسة جدوى مالية لافتتاح مشروع في التجمع',
    'أريد مراجعة بنود اتفاقية الشركاء المؤسسين',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col h-[600px] animate-in fade-in zoom-in-95 duration-200 text-right">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/30 text-teal-300 flex items-center justify-center border border-teal-400/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">مساعد وسيط الذكي (WASEET AI)</h3>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full font-semibold border border-teal-500/30">
                  Gemini API
                </span>
              </div>
              <p className="text-xs text-slate-300">
                المساعد الذكي لتحديد التخصص الاستشاري وصياغة الطلبات
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAIModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legal & Medical Guardrail Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-[11px] text-amber-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>تنويه نظام:</strong> المساعد الذكي يساعد في توجيهك واقتراح التخصص وصياغة الأسئلة، ولا يعد بديلاً عن الاستشارة المهنية القانونية أو الطبية أو المالية المعتمدة.
          </span>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-start' : 'items-end'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                {msg.sender === 'ai' ? (
                  <>
                    <Bot className="w-3.5 h-3.5 text-blue-600" />
                    <span>مساعد وسيط</span>
                  </>
                ) : (
                  <span>أنت</span>
                )}
              </div>
              <div
                className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-xs'
                    : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200 shadow-xs whitespace-pre-line'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
              <Bot className="w-4 h-4 animate-spin text-blue-600" />
              <span>جاري التفكير وتحليل الاحتياج الاستشاري...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2.5 bg-white border-t border-slate-200 flex flex-wrap gap-1.5 overflow-x-auto text-[11px]">
          <span className="font-semibold text-slate-400 self-center">أسئلة شائعة:</span>
          {sampleChips.map((chip, i) => (
            <button
              key={i}
              onClick={() => handleSend(chip)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg transition cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Action Shortcuts */}
        <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            onClick={() => {
              setIsAIModalOpen(false);
              setActiveView('consultants');
            }}
            className="text-blue-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>تصفح دليل المستشارين</span>
          </button>
          <button
            onClick={() => {
              setIsAIModalOpen(false);
              setIsRFQModalOpen(true);
            }}
            className="text-teal-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>نشر طلب استشارة (RFQ)</span>
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="اكتب استفسارك أو مشكلتك لمساعدتك في اختيار التخصص المناسب..."
              className="flex-1 text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-900"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
            >
              <span>إرسال</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
