import React, { useState } from 'react';
import { CatalogService } from '../types';
import { useApp } from '../context/AppContext';
import {
  CheckCircle,
  Clock,
  Heart,
  MapPin,
  Monitor,
  ShoppingBag,
  Star,
  UserCheck,
  Briefcase,
} from 'lucide-react';

interface ServiceCardProps {
  service: CatalogService;
  isFavorited: boolean;
  onToggleFavorite: (serviceId: string) => void;
  onOpenDetails: (serviceId: string) => void;
  onOrderService: (service: CatalogService) => void;
  onOpenProvider?: (consultantId: string) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  isFavorited,
  onToggleFavorite,
  onOpenDetails,
  onOrderService,
  onOpenProvider,
}) => {
  const { lang, consultants, setSelectedConsultant } = useApp();
  const [imgError, setImgError] = useState(false);

  const deliveryLabel =
    service.deliveryMode === 'online'
      ? lang === 'ar'
        ? 'أونلاين'
        : 'Online'
      : service.deliveryMode === 'in_person'
      ? lang === 'ar'
        ? 'حضوري'
        : 'In-Person'
      : lang === 'ar'
      ? 'أونلاين أو حضوري'
      : 'Hybrid';

  const handleProviderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenProvider) {
      onOpenProvider(service.consultantId);
      return;
    }
    const found = consultants.find((c) => c.id === service.consultantId);
    if (found) setSelectedConsultant(found);
  };

  return (
    <article
      className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-200 overflow-hidden flex flex-col justify-between group"
      data-testid={`service-card-${service.id}`}
    >
      <div>
        {/* Image Header */}
        <div
          onClick={() => onOpenDetails(service.id)}
          className="relative aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer"
        >
          {!imgError && service.imageUrl ? (
            <img
              src={service.imageUrl}
              alt={lang === 'ar' ? service.titleAr : service.titleEn}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-50 via-slate-100 to-teal-50 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
              <Briefcase className="w-10 h-10 text-blue-500/50 mb-2" />
              <span className="text-xs font-semibold text-slate-600 line-clamp-2">
                {lang === 'ar' ? service.categoryNameAr : service.categoryNameEn}
              </span>
            </div>
          )}

          {/* Top Floating Actions */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-xs text-[11px] font-bold text-slate-800 shadow-xs border border-slate-200/70">
              {lang === 'ar' ? service.categoryNameAr : service.categoryNameEn}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(service.id);
              }}
              aria-label={isFavorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
              className={`p-2 rounded-xl border shadow-xs transition cursor-pointer ${
                isFavorited
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-white/95 border-slate-200 text-slate-500 hover:text-rose-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-600' : ''}`} />
            </button>
          </div>

          {service.isDemo && (
            <span className="absolute bottom-2.5 left-3 px-2 py-0.5 rounded bg-slate-900/75 text-white text-[10px] font-medium">
              {lang === 'ar' ? 'نموذج عرض' : 'Demo'}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">
          {/* Subcategory & Delivery Mode */}
          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 font-medium">
            <span className="truncate text-blue-700 font-semibold">
              {lang === 'ar' ? service.subcategoryNameAr : service.subcategoryNameEn}
            </span>
            <span className="inline-flex items-center gap-1 shrink-0 text-slate-600">
              {service.deliveryMode === 'in_person' ? (
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
              ) : (
                <Monitor className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span>{deliveryLabel}</span>
            </span>
          </div>

          {/* Title & Description */}
          <div>
            <h3
              onClick={() => onOpenDetails(service.id)}
              className="text-base font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors cursor-pointer"
            >
              {lang === 'ar' ? service.titleAr : service.titleEn}
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
              {lang === 'ar' ? service.shortDescriptionAr : service.shortDescriptionEn}
            </p>
          </div>

          {/* Provider Row */}
          <button
            type="button"
            onClick={handleProviderClick}
            className="w-full flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-right cursor-pointer hover:bg-slate-50/80 rounded-xl p-1.5 -mx-1.5 transition"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={service.providerAvatar}
                alt={service.providerName}
                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-900 truncate">{service.providerName}</span>
                  {service.providerVerified && (
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-label="مستشار موثق" />
                  )}
                </div>
                <span className="text-[11px] text-slate-500 block truncate">{service.providerTitle}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-amber-700 shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{service.rating > 0 ? service.rating.toFixed(1) : 'جديد'}</span>
              <span className="text-[10px] text-slate-400 font-normal">({service.reviewCount})</span>
            </div>
          </button>

          {/* Crisp Unboxed Metadata */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>مدة التنفيذ: {service.executionDays} أيام</span>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>{service.ordersCount} طلب منفذ</span>
            </span>
          </div>
        </div>
      </div>

      {/* Footer Price & Actions */}
      <div className="px-5 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <span className="text-[11px] text-slate-500 block">سعر الخدمة</span>
          <span className="text-lg font-black text-slate-900">
            {service.priceEgp.toLocaleString('ar-EG')}{' '}
            <span className="text-xs font-bold text-blue-600">ج.م</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenDetails(service.id)}
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition cursor-pointer whitespace-nowrap"
          >
            عرض التفاصيل
          </button>
          <button
            type="button"
            onClick={() => onOrderService(service)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>طلب الخدمة</span>
          </button>
        </div>
      </div>
    </article>
  );
};
