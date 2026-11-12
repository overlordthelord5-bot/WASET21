import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Category } from '../types';
import {
  Calculator,
  FileCheck,
  Receipt,
  TrendingUp,
  Building2,
  Scale,
  Briefcase,
  Users,
  Megaphone,
  ShoppingBag,
  Server,
  Code,
  Bot,
  Rocket,
  Kanban,
  Home,
  Compass,
  GraduationCap,
  UserCheck,
  Globe,
  Store,
  Sprout,
  Factory,
  Truck,
  Palette,
  HeartHandshake,
  Search,
  ArrowLeft,
  ArrowRight,
  Filter,
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Calculator,
  FileCheck,
  Receipt,
  TrendingUp,
  Building2,
  Scale,
  Briefcase,
  Users,
  Megaphone,
  ShoppingBag,
  Server,
  Code,
  Bot,
  Rocket,
  Kanban,
  Home,
  Compass,
  GraduationCap,
  UserCheck,
  Globe,
  Store,
  Sprout,
  Factory,
  Truck,
  Palette,
  HeartHandshake,
};

export const CategoryCatalog: React.FC<{
  onSelectCategory?: (categoryId: string) => void;
}> = ({ onSelectCategory }) => {
  const { categories, lang, setActiveView } = useApp();
  const [filterQuery, setFilterQuery] = useState('');

  const filtered = categories.filter((c) => {
    const q = filterQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.nameAr.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.descriptionAr.toLowerCase().includes(q) ||
      c.descriptionEn.toLowerCase().includes(q)
    );
  });

  const handleCategoryClick = (category: Category) => {
    if (onSelectCategory) {
      onSelectCategory(category.id);
    } else {
      setActiveView('consultants');
    }
  };

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
            <span>26+ تخصصاً استشارياً معتمداً</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            كتالوج التخصصات الاستشارية
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            استكشف جميع المجالات التخصصية المغطاة في منصة وسيط بواسطة مستشارين وخبراء معتمدين في مصر.
          </p>
        </div>

        {/* Search inside categories */}
        <div className="w-full md:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="ابحث في التخصصات..."
            className="w-full text-xs bg-white border border-slate-200 rounded-xl py-2.5 px-9 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((category) => {
          const IconComponent = ICON_MAP[category.iconName] || Briefcase;
          return (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-600 group-hover:text-white text-blue-600 transition-colors flex items-center justify-center shrink-0">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {category.consultantCount} مستشار
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {lang === 'ar' ? category.nameAr : category.nameEn}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {lang === 'ar' ? category.descriptionAr : category.descriptionEn}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-semibold">
                <span>استعراض المستشارين</span>
                {lang === 'ar' ? (
                  <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
                ) : (
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <Filter className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">لا توجد تخصصات مطابقة لبحثك</h4>
          <p className="text-xs text-slate-500 mt-1">جرب البحث بكلمة أخرى مثل "ضرائب" أو "قانون" أو "برمجة"</p>
          <button
            onClick={() => setFilterQuery('')}
            className="mt-3 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
          >
            إعادة تعيين البحث
          </button>
        </div>
      )}
    </section>
  );
};
