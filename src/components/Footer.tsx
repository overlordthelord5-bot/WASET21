import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Mail, Phone, MapPin, Globe, Lock } from 'lucide-react';
import { NewsletterSignup } from './NewsletterSignup';

export const Footer: React.FC = () => {
  const { setActiveView, lang } = useApp();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800 text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Signup Component */}
        <NewsletterSignup />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Col 1 & 2: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1">
                  WASEET <span className="text-blue-500 font-extrabold">وسيط</span>
                </span>
                <span className="text-xs text-slate-400 block -mt-1">
                  كل خبرة تحتاجها، تجدها في وسيط
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              منصة وساطة استشارية رائدة في جمهورية مصر العربية لربط الأفراد وأصحاب المشروعات بنخبة المستشارين والخبراء
              المعتمدين في أكثر من 26 تخصصاً استشارياً، مع حماية كاملة للمدفوعات تحت نظام الضمان المالي (Escrow).
            </p>

            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>القاهرة الجديدة، التجمع الخامس، جمهورية مصر العربية</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>خدمة العملاء: +20 (2) 2810-9900</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>support@waseet.eg</span>
              </p>
            </div>
          </div>

          {/* Col 3: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">روابط المنصة</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setActiveView('home')}
                  className="hover:text-blue-400 transition cursor-pointer"
                >
                  الرئيسية
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('categories')}
                  className="hover:text-blue-400 transition cursor-pointer"
                >
                  كتالوج التخصصات (26+)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('consultants')}
                  className="hover:text-blue-400 transition cursor-pointer"
                >
                  دليل المستشارين المعتمدين
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('services')}
                  className="hover:text-blue-400 transition cursor-pointer"
                >
                  الخدمات الاستشارية
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('rfq')}
                  className="hover:text-blue-400 transition cursor-pointer"
                >
                  طلبات عروض الأسعار (RFQ)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">الشروط والسياسات</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => setActiveView('help')} className="hover:text-blue-400 transition cursor-pointer">
                  الشروط والأحكام العامة
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('help')} className="hover:text-blue-400 transition cursor-pointer">
                  سياسة الخصوصية وأمان البيانات
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('help')} className="hover:text-blue-400 transition cursor-pointer">
                  سياسة الإلغاء والاسترداد المالي
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('help')} className="hover:text-blue-400 transition cursor-pointer">
                  نظام فض النزاعات وحساب الضمان
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('help')} className="hover:text-blue-400 transition cursor-pointer">
                  معايير التوثيق واعتماد التراخيص
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: Security & Regulatory */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">الأمان والتشغيل</h4>
            <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>حماية الضمان المالي</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                جميع المدفوعات تتم بالجنيه المصري (EGP) عبر بوابات دفع معتمدة من البنك المركزي المصري.
              </p>
              <div className="pt-2 border-t border-slate-700 text-[10px] text-slate-500 font-mono">
                المنطقة الزمنية: Africa/Cairo
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            جميع الحقوق محفوظة © {new Date().getFullYear()} منصة وسيط (WASEET Egypt).
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>سجل تجاري مصري: 184920</span>
            <span>•</span>
            <span>بطاقة ضريبية: 712-409-183</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
