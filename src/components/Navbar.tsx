import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Compass,
  Users,
  Briefcase,
  HelpCircle,
  FileText,
  ShieldCheck,
  Bot,
  UserCheck,
  Globe,
  Bell,
  Menu,
  X,
  PlusCircle,
  LogIn,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const {
    lang,
    toggleLang,
    currentUser,
    switchUserRole,
    activeView,
    setActiveView,
    setIsBookingModalOpen,
    setIsRFQModalOpen,
    setIsAIModalOpen,
    setIsAuthModalOpen,
    setAuthMode,
    bookings,
    orders,
    disputes,
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const pendingBookingsCount = bookings.filter((b) => b.status === 'confirmed').length;

  const roleLabels: Record<UserRole, { ar: string; en: string }> = {
    client: { ar: 'عميل (Client)', en: 'Client' },
    consultant: { ar: 'مستشار (Consultant)', en: 'Consultant' },
    admin: { ar: 'مدير المنصة (Admin)', en: 'Admin' },
    support: { ar: 'خدمة العملاء (Support)', en: 'Support' },
    affiliate: { ar: 'مسوق بالعمولة (Affiliate)', en: 'Affiliate' },
    partner: { ar: 'شريك استراتيجي (Partner)', en: 'Partner' },
    seller: { ar: 'بائع أدوات (Seller)', en: 'Seller' },
  };

  const navLinks = [
    { id: 'home', labelAr: 'الرئيسية', labelEn: 'Home', icon: Compass },
    { id: 'categories', labelAr: 'التخصصات (26+)', labelEn: 'Specialties', icon: Briefcase },
    { id: 'consultants', labelAr: 'دليل المستشارين', labelEn: 'Consultants', icon: Users },
    { id: 'services', labelAr: 'الخدمات الاستشارية', labelEn: 'Services', icon: FileText },
    { id: 'rfq', labelAr: 'طلبات عروض الأسعار (RFQ)', labelEn: 'RFQ Requests', icon: PlusCircle },
    { id: 'dashboard', labelAr: 'لوحة التحكم', labelEn: 'Dashboard', icon: UserCheck },
    { id: 'help', labelAr: 'المساعدة والأسئلة الشائعة', labelEn: 'Help & FAQ', icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Banner Notice for Egyptian Market & Escrow */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-700/60 text-blue-100 border border-blue-500/30">
              مصر EGP
            </span>
            <span className="hidden sm:inline">
              منصة الوساطة الاستشارية الأولى في مصر • جميع المعاملات محمية بنظام الضمان المالي (Escrow)
            </span>
            <span className="sm:hidden">وسيط للاستشارات • حماية الضمان البنكي EGP</span>
          </div>

          <div className="flex items-center gap-3">
            {/* AI Assistant Quick Trigger */}
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-blue-200 hover:text-white bg-blue-700/40 hover:bg-blue-700/70 px-2.5 py-0.5 rounded-full text-xs transition cursor-pointer"
              title="مساعد وسيط الذكي لتحديد التخصص المناسب"
            >
              <Bot className="w-3.5 h-3.5 text-amber-300" />
              <span>المساعد الذكي (AI)</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLang}
              className="inline-flex items-center gap-1 text-slate-200 hover:text-white px-2 py-0.5 rounded transition cursor-pointer text-xs"
              aria-label="تغيير اللغة"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('home')}
              className="flex items-center gap-2.5 text-right cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1">
                  WASEET <span className="text-blue-600 font-extrabold">وسيط</span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium -mt-1">
                  كل خبرة تحتاجها، تجدها في وسيط
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{lang === 'ar' ? item.labelAr : item.labelEn}</span>
                </button>
              );
            })}
          </nav>

          {/* User Controls & Role Switcher */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Quick Post RFQ */}
            <button
              onClick={() => setIsRFQModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>طلب عرض سعر</span>
            </button>

            {/* Role Switcher (For testing full multi-role platform) */}
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                title="التبديل بين أدوار المنصة لتجربة صلاحيات العميل والمستشار والمدير"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>دورك الآن: {roleLabels[currentUser.role]?.ar || currentUser.role}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    تبديل دور المستخدم (Demo RBAC)
                  </div>
                  {(['client', 'consultant', 'admin', 'support', 'affiliate', 'partner', 'seller'] as UserRole[]).map(
                    (role) => (
                      <button
                        key={role}
                        onClick={() => {
                          switchUserRole(role);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full text-right px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-50 transition cursor-pointer ${
                          currentUser.role === role ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <span>{roleLabels[role].ar}</span>
                        {currentUser.role === role && <span className="text-blue-600 text-xs">✓ نشط</span>}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* User Profile / Login */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer text-right"
                  title="الانتقال إلى لوحة التحكم"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                  <div className="hidden xl:flex flex-col">
                    <span className="text-xs font-semibold text-slate-800 leading-tight">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500">{currentUser.role}</span>
                  </div>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>تسجيل الدخول</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden gap-2">
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
              aria-label="المساعد الذكي"
            >
              <Bot className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
              aria-label="القائمة الرئيسية"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <div className="grid grid-cols-1 gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-right px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer ${
                    isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span>{lang === 'ar' ? item.labelAr : item.labelEn}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => {
                setIsRFQModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-4 rounded-xl text-center text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer"
            >
              + نشر طلب استشارة مجاناً (RFQ)
            </button>

            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs">
              <span className="text-slate-600">الدور الحالي:</span>
              <select
                value={currentUser.role}
                onChange={(e) => switchUserRole(e.target.value as UserRole)}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs"
              >
                <option value="client">عميل (Client)</option>
                <option value="consultant">مستشار (Consultant)</option>
                <option value="admin">مدير (Admin)</option>
                <option value="support">دعم فني (Support)</option>
                <option value="affiliate">مسوق بالعمولة (Affiliate)</option>
                <option value="partner">شريك (Partner)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
