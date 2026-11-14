import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ConsultantProfile, DeliveryMode } from '../types';
import {
  Search,
  Star,
  CheckCircle,
  MapPin,
  Clock,
  Video,
  Mic,
  MessageSquare,
  FileText,
  Building,
  Heart,
  SlidersHorizontal,
  X,
  Calendar,
  Sparkles,
} from 'lucide-react';

const DELIVERY_MODE_LABELS: Record<DeliveryMode, { label: string; icon: React.FC<{ className?: string }> }> = {
  video: { label: 'فيديو', icon: Video },
  audio: { label: 'صوتي', icon: Mic },
  chat: { label: 'محادثة', icon: MessageSquare },
  written: { label: 'مكتوبة', icon: FileText },
  in_person: { label: 'حضوري', icon: Building },
};

export const ConsultantDirectory: React.FC<{
  initialCategoryId?: string;
  initialQuery?: string;
}> = ({ initialCategoryId = '', initialQuery = '' }) => {
  const {
    consultants,
    categories,
    setSelectedConsultant,
    setIsBookingModalOpen,
    navigateToServicesCatalog,
    lang,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryId);
  const [selectedCatalogServiceId, setSelectedCatalogServiceId] = useState('');
  const [catalogServicesList, setCatalogServicesList] = useState<Array<{ id: string; titleAr: string; consultantId: string }>>([]);
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'price_asc' | 'price_desc'>('rating');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    fetch('/api/services?pageSize=50')
      .then((r) => r.json())
      .then((d) => {
        if (d?.items) setCatalogServicesList(d.items);
      })
      .catch(() => {});
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredConsultants = useMemo(() => {
    return consultants
      .filter((c) => {
        // Query search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = c.nameAr.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q);
          const matchTitle = c.titleAr.toLowerCase().includes(q) || c.titleEn.toLowerCase().includes(q);
          const matchSkills = c.skills.some((s) => s.toLowerCase().includes(q));
          if (!matchName && !matchTitle && !matchSkills) return false;
        }

        // Category filter
        if (selectedCategory && !c.categoryIds.includes(selectedCategory)) {
          return false;
        }

        // Max price filter
        if (c.sessionRateEgp > maxPrice) {
          return false;
        }

        // Delivery mode filter
        if (selectedMode !== 'all' && !c.deliveryModes.includes(selectedMode as DeliveryMode)) {
          return false;
        }

        // Service filter
        if (selectedCatalogServiceId) {
          const targetSrv = catalogServicesList.find((s) => s.id === selectedCatalogServiceId);
          if (targetSrv && c.id !== targetSrv.consultantId) return false;
        }

        // Verified filter
        if (verifiedOnly && c.verificationStatus !== 'verified') {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'experience') return b.yearsExperience - a.yearsExperience;
        if (sortBy === 'price_asc') return a.sessionRateEgp - b.sessionRateEgp;
        if (sortBy === 'price_desc') return b.sessionRateEgp - a.sessionRateEgp;
        return 0;
      });
  }, [consultants, searchQuery, selectedCategory, selectedCatalogServiceId, catalogServicesList, maxPrice, selectedMode, verifiedOnly, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedCatalogServiceId('');
    setMaxPrice(3000);
    setSelectedMode('all');
    setVerifiedOnly(false);
    setSortBy('rating');
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>المستشارون المعتمدون في مصر</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          دليل المستشارين والخبراء
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          تصفح قائمة المستشارين المعتمدين والموثقين رسمياً، قارن الخبرات والأسعار بالجنيه المصري، واحجز جلستك مباشرة تحت حماية الضمان.
        </p>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="اسم المستشار، المهارة، التخصص..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-9 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="">جميع التخصصات</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Delivery Mode Filter */}
          <div>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">كل طرق تقديم الاستشارة</option>
              <option value="video">جلسة فيديو مباشرة</option>
              <option value="audio">جلسة صوتية</option>
              <option value="chat">محادثة نصية</option>
              <option value="written">استشارة كتابية مفصلة</option>
              <option value="in_person">حضور شخصي</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="rating">الأعلى تقييماً</option>
              <option value="experience">الأكثر خبرة (سنوات)</option>
              <option value="price_asc">السعر: من الأقل للأعلى</option>
              <option value="price_desc">السعر: من الأعلى للأقل</option>
            </select>
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-6">
            {/* Price slider */}
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">الحد الأقصى للسعر:</span>
              <input
                type="range"
                min="500"
                max="3000"
                step="100"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-28 sm:w-36 accent-blue-600 cursor-pointer"
              />
              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                {maxPrice} ج.م
              </span>
            </div>

            {/* Verified only toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-slate-700 font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                المعتمدون والموثقون فقط
              </span>
            </label>
            {/* Service Offered Filter */}
            {catalogServicesList.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium">الخدمة الاستشارية:</span>
                <select
                  value={selectedCatalogServiceId}
                  onChange={(e) => setSelectedCatalogServiceId(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 max-w-[220px] cursor-pointer"
                >
                  <option value="">كل الخدمات</option>
                  {catalogServicesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.titleAr}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-medium">
              النتائج المتاحة: <span className="font-bold text-slate-800">{filteredConsultants.length}</span> مستشار
            </span>
            {(searchQuery || selectedCategory || selectedCatalogServiceId || maxPrice < 3000 || selectedMode !== 'all') && (
              <button
                onClick={resetFilters}
                className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>إلغاء التصفية</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Consultants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredConsultants.map((consultant) => {
          const isFav = !!favorites[consultant.id];
          return (
            <div
              key={consultant.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-200 p-5 flex flex-col justify-between group"
            >
              <div>
                {/* Header: Avatar, Verified Badge, Rating, Favorite */}
                <div className="flex items-start justify-between gap-3">
                  <div className="relative">
                    <img
                      src={consultant.avatar}
                      alt={consultant.nameAr}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-xs"
                    />
                    {consultant.verificationStatus === 'verified' && (
                      <span
                        className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full shadow-xs"
                        title="مستشار معتمد ومتحقق من هويته وتراخيصه"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-lg text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{consultant.rating.toFixed(2)}</span>
                      <span className="text-[10px] text-amber-600 font-normal">({consultant.reviewCount})</span>
                    </div>

                    <button
                      onClick={(e) => toggleFavorite(consultant.id, e)}
                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                        isFav
                          ? 'bg-rose-50 border-rose-200 text-rose-600'
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-500'
                      }`}
                      aria-label="إضافة للمفضلة"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-600' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Name & Title */}
                <div className="mt-3">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {lang === 'ar' ? consultant.nameAr : consultant.nameEn}
                    </h3>
                  </div>
                  <p className="text-xs text-blue-700 font-semibold mt-0.5">
                    {lang === 'ar' ? consultant.titleAr : consultant.titleEn}
                  </p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{consultant.city}</span>
                    <span>•</span>
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>خبرة {consultant.yearsExperience} سنة</span>
                  </p>
                </div>

                {/* Bio snippet */}
                <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                  {lang === 'ar' ? consultant.bioAr : consultant.bioEn}
                </p>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {consultant.skills.slice(0, 3).map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Delivery Modes icons */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-400">طرق الاستشارة:</span>
                  <div className="flex items-center gap-1.5">
                    {consultant.deliveryModes.map((mode) => {
                      const ModeInfo = DELIVERY_MODE_LABELS[mode];
                      const Icon = ModeInfo.icon;
                      return (
                        <span
                          key={mode}
                          className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200"
                          title={ModeInfo.label}
                        >
                          <Icon className="w-3 h-3 text-blue-600" />
                          <span>{ModeInfo.label}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer: Price & CTA Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs text-slate-400 block font-normal">سعر الجلسة ({consultant.sessionDurationMinutes} دقيقة):</span>
                  <span className="text-base font-extrabold text-slate-900">
                    {consultant.sessionRateEgp.toLocaleString('ar-EG')} <span className="text-xs font-bold text-blue-600">ج.م</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => navigateToServicesCatalog({ providerId: consultant.id })}
                    className="px-2.5 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition cursor-pointer whitespace-nowrap"
                  >
                    خدماته
                  </button>
                  <button
                    onClick={() => setSelectedConsultant(consultant)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer whitespace-nowrap"
                  >
                    الملف الشخصي
                  </button>
                  <button
                    onClick={() => {
                      setSelectedConsultant(consultant);
                      setIsBookingModalOpen(true);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition cursor-pointer flex items-center gap-1 whitespace-nowrap"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>حجز</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredConsultants.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 mt-6">
          <SlidersHorizontal className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">لم يتم العثور على مستشارين بهذه المعايير</h3>
          <p className="text-xs text-slate-500 mt-1">جرب توسيع نطاق السعر أو اختيار تخصص آخر</p>
          <button
            onClick={resetFilters}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer"
          >
            إعادة تعيين جميع الفلاتر
          </button>
        </div>
      )}
    </div>
  );
};
