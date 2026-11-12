import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, Sparkles, Loader2 } from 'lucide-react';

export const NewsletterSignup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['الضرائب والفاتورة الإلكترونية', 'تأسيس الشركات']);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'already' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const interestOptions = [
    'الضرائب والفاتورة الإلكترونية',
    'تأسيس الشركات وGAFI',
    'الاستشارات القانونية',
    'دراسات الجدوى والاستثمار',
    'الذكاء الاصطناعي والتقنية',
  ];

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isLoading) return;

    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          interests: selectedInterests,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.alreadySubscribed) {
          setStatus('already');
        } else {
          setStatus('success');
          setEmail('');
        }
        setMessage(data.message || 'تم الاشتراك بنجاح في نشرة وسيط الاستشارية.');
      } else {
        setStatus('error');
        setMessage(data.error || 'عذراً، تعذر تسجيل الاشتراك. يرجى التأكد من صحة البريد والمحاولة ثانية.');
      }
    } catch (err: any) {
      console.error('Newsletter subscription network error:', err);
      setStatus('error');
      setMessage('حدث خطأ في الاتصال بالخادم. يرجى المحاولة بعد قليل.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 border border-blue-900/60 shadow-xl text-right mb-12 relative overflow-hidden">
      {/* Decorative ambient glow */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        {/* Left Side (Arabic Right): Copy & Interests */}
        <div className="max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs font-bold border border-blue-500/20">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>نشرة وسيط الاستشارية الأسبوعية</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            واكب التحديثات الضريبية والقانونية وحصريات الأعمال في مصر
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            انضم إلى أكثر من 3,500 رائد أعمال ومدير شركة يتلقون أسبوعياً ملخص قرارات الفاتورة الإلكترونية، لوائح تأسيس الشركات، وتخفيضات حصرية على الجلسات الاستشارية.
          </p>

          {/* Quick Interests Tags */}
          <div className="pt-2">
            <span className="text-[11px] text-slate-400 block mb-2 font-medium">
              اختر المجالات الأكثر أهمية لنشاطك (اختياري):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {interestOptions.map((opt) => {
                const isSelected = selectedInterests.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleInterest(opt)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border border-blue-400 shadow-xs'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/80'
                    }`}
                  >
                    {opt} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side (Arabic Left): Signup Form Box */}
        <div className="w-full lg:max-w-md bg-white/5 border border-white/10 backdrop-blur-md p-5 sm:p-6 rounded-2xl space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="newsletter-email" className="text-xs font-bold text-slate-200 block mb-1.5">
                البريد الإلكتروني للعمل
              </label>
              <div className="relative">
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="مثال: founder@company.eg"
                  dir="ltr"
                  disabled={isLoading}
                  className="w-full bg-slate-900/90 text-white placeholder-slate-500 text-xs sm:text-sm rounded-xl px-4 py-3 pl-10 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition disabled:opacity-60"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تسجيل الاشتراك...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>اشتراك مجاني في النشرة</span>
                </>
              )}
            </button>
          </form>

          {/* Feedback Messages */}
          {status === 'success' && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-start gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          {status === 'already' && (
            <div className="p-3 bg-blue-950/80 border border-blue-500/40 rounded-xl text-blue-200 text-xs flex items-start gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          {status === 'error' && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          <p className="text-[11px] text-slate-400 leading-normal flex items-center gap-1.5 pt-1">
            <span>🔒 نحترم خصوصيتك بالكامل. بدون إعلانات مزعجة، ويمكنك إلغاء الاشتراك بنقرة واحدة.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
