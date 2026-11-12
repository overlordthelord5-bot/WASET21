import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ShieldCheck,
  CheckCircle,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../types';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authMode,
    setAuthMode,
    loginUser,
    registerUser,
    switchUserRole,
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+201012345678');
  const [role, setRole] = useState<UserRole>('client');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (authMode === 'login') {
      if (!email.trim() || !password) {
        setErrorMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور');
        return;
      }
      loginUser(email, role);
    } else {
      if (!fullName.trim() || !email.trim() || !phone.trim() || !password) {
        setErrorMessage('يرجى ملء جميع الحقول المطلوبة');
        return;
      }
      if (!agreedTerms) {
        setErrorMessage('يجب الموافقة على شروط الاستخدام وسياسة الخصوصية');
        return;
      }
      registerUser(fullName, email, phone, role);
    }
  };

  const handleQuickDemoLogin = (selectedRole: UserRole) => {
    switchUserRole(selectedRole);
    setIsAuthModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-8 p-6 text-right animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              و
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {authMode === 'login' ? 'تسجيل الدخول إلى وسيط' : 'إنشاء حساب جديد'}
            </h3>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Quick Switcher Badge */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>تجربة المنصة الفورية (حسابات Demo الجاهزة):</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('client')}
              className="p-1.5 bg-white hover:bg-blue-100/60 text-slate-800 rounded-lg border border-blue-200 font-semibold cursor-pointer text-center"
            >
              عميل (أحمد محمود)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('consultant')}
              className="p-1.5 bg-white hover:bg-blue-100/60 text-slate-800 rounded-lg border border-blue-200 font-semibold cursor-pointer text-center"
            >
              مستشار (د. طارق السعيد)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin')}
              className="p-1.5 bg-white hover:bg-blue-100/60 text-slate-800 rounded-lg border border-blue-200 font-semibold cursor-pointer text-center"
            >
              مدير المنصة (سارة إبراهيم)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('support')}
              className="p-1.5 bg-white hover:bg-blue-100/60 text-slate-800 rounded-lg border border-blue-200 font-semibold cursor-pointer text-center"
            >
              خدمة العملاء (مروان عادل)
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
              {errorMessage}
            </div>
          )}

          {authMode === 'register' && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">الاسم الكامل</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="محمد أحمد إبراهيم"
                  className="w-full text-xs p-2.5 pr-9 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-xs p-2.5 pr-9 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-left rtl:text-right"
                required
              />
            </div>
          </div>

          {authMode === 'register' && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">رقم الهاتف المصري (+20)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+2010XXXXXXXX"
                  className="w-full text-xs p-2.5 pr-9 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-left rtl:text-right font-mono"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">كلمة المرور</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs p-2.5 pr-9 pl-9 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-left rtl:text-right"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {authMode === 'register' && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">نوع الحساب</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50 cursor-pointer"
              >
                <option value="client">عميل (مستفيد من الاستشارات)</option>
                <option value="consultant">مستشار / خبير (تقديم الاستشارات)</option>
                <option value="affiliate">مسوق بالعمولة (Affiliate)</option>
              </select>
            </div>
          )}

          {authMode === 'register' && (
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none pt-1">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>أوافق على شروط الاستخدام وسياسة الخصوصية لمنصة وسيط</span>
            </label>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            {authMode === 'login' ? 'دخول الحساب' : 'إنشاء الحساب الآن'}
          </button>
        </form>

        {/* Switch Auth Mode */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
          {authMode === 'login' ? (
            <span>
              ليس لديك حساب؟{' '}
              <button
                onClick={() => setAuthMode('register')}
                className="text-blue-600 font-bold hover:underline cursor-pointer"
              >
                إنشاء حساب جديد
              </button>
            </span>
          ) : (
            <span>
              لديك حساب بالفعل؟{' '}
              <button
                onClick={() => setAuthMode('login')}
                className="text-blue-600 font-bold hover:underline cursor-pointer"
              >
                تسجيل الدخول
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
