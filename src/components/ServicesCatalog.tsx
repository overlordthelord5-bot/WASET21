import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ConsultationService } from '../types';
import {
  FileText,
  Clock,
  CheckCircle,
  Video,
  ArrowLeft,
  ArrowRight,
  Search,
  Filter,
} from 'lucide-react';

export const ServicesCatalog: React.FC = () => {
  const {
    services,
    categories,
    consultants,
    setSelectedConsultant,
    setBookingPreselectedService,
    setIsBookingModalOpen,
    lang,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredServices = services.filter((srv) => {
    if (selectedCategory && srv.categoryId !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        srv.titleAr.toLowerCase().includes(q) ||
        srv.titleEn.toLowerCase().includes(q) ||
        srv.descriptionAr.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleBookService = (service: ConsultationService) => {
    const consultant = consultants.find((c) => c.id === service.consultantId);
    if (consultant) {
      setSelectedConsultant(consultant);
      setBookingPreselectedService(service);
      setIsBookingModalOpen(true);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-right">
      {/* Title */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          <span>باقات استشارية محددة النطاق والمخرجات</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          الخدمات الاستشارية المميزة
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          باقات استشارية واضحة المعالم، محددة السعر والمخرجات والوقت، مقدمة من نخبة المستشارين المعتمدين في مصر.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-8 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن خدمة استشارية محددة..."
            className="w-full text-xs p-2.5 pr-9 bg-slate-50 border border-slate-200 rounded-xl"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
          >
            <option value="">جميع التخصصات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameAr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredServices.map((service) => {
          const consultant = consultants.find((c) => c.id === service.consultantId);
          const category = categories.find((c) => c.id === service.categoryId);

          return (
            <div
              key={service.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                    {category ? category.nameAr : 'استشارات'}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{service.durationMinutes} دقيقة</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {lang === 'ar' ? service.titleAr : service.titleEn}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-2">
                  {lang === 'ar' ? service.descriptionAr : service.descriptionEn}
                </p>

                {/* Deliverables */}
                <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                  <span className="font-bold text-slate-700 block">ما ستحصل عليه في هذه الخدمة:</span>
                  {service.deliverablesAr.map((del, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-600 text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{del}</span>
                    </div>
                  ))}
                </div>

                {/* Consultant Info */}
                {consultant && (
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                    <img
                      src={consultant.avatar}
                      alt={consultant.nameAr}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{consultant.nameAr}</span>
                      <span className="text-[11px] text-slate-500">{consultant.titleAr}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Price & Action */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-normal">سعر الباقة الاستشارية:</span>
                  <span className="text-lg font-black text-blue-700">
                    {service.priceEgp.toLocaleString('ar-EG')} <span className="text-xs font-bold">ج.م</span>
                  </span>
                </div>

                <button
                  onClick={() => handleBookService(service)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>حجز هذه الباقة</span>
                  {lang === 'ar' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
