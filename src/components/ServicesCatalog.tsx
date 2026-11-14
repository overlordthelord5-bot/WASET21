import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CatalogDeliveryMode,
  CatalogService,
  ServiceCategoryNode,
} from '../types';
import { catalogFetch } from '../utils/catalogApi';
import { ServiceCard } from './ServiceCard';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  Layers,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from 'lucide-react';

export const ServicesCatalog: React.FC = () => {
  const {
    lang,
    currentUser,
    consultants,
    setSelectedConsultant,
    navigateToService,
    setServiceOrderModalService,
    catalogInitialFilters,
    navigateToConsultantDirectoryWithService,
    catalogRefreshTick,
  } = useApp();

  const catalogGridRef = useRef<HTMLDivElement | null>(null);

  // Categories from API (18+ main + subcategories)
  const [categories, setCategories] = useState<ServiceCategoryNode[]>([]);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Curated highlights from API
  const [mostRequested, setMostRequested] = useState<CatalogService[]>([]);
  const [featuredServices, setFeaturedServices] = useState<CatalogService[]>([]);
  const [recommendedServices, setRecommendedServices] = useState<CatalogService[]>([]);

  // Filter & pagination state
  const [searchQuery, setSearchQuery] = useState(catalogInitialFilters.q || '');
  const [debouncedQuery, setDebouncedQuery] = useState(catalogInitialFilters.q || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState(catalogInitialFilters.categoryId || '');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState(catalogInitialFilters.providerId || '');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minRating, setMinRating] = useState<string>('');
  const [maxDays, setMaxDays] = useState<string>('');
  const [deliveryMode, setDeliveryMode] = useState<CatalogDeliveryMode | 'all'>('all');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'most_requested' | 'newest' | 'price_asc' | 'price_desc' | 'rating'>('most_requested');
  const [page, setPage] = useState<number>(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Paginated results
  const [items, setItems] = useState<CatalogService[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync incoming initial filters when navigating from Consultant Profile or Specialties
  useEffect(() => {
    if (catalogInitialFilters.providerId !== undefined) {
      setSelectedProviderId(catalogInitialFilters.providerId || '');
    }
    if (catalogInitialFilters.categoryId !== undefined) {
      setSelectedCategoryId(catalogInitialFilters.categoryId || '');
      setSelectedSubcategoryId('');
    }
    if (catalogInitialFilters.q !== undefined) {
      setSearchQuery(catalogInitialFilters.q || '');
      setDebouncedQuery(catalogInitialFilters.q || '');
    }
    setPage(1);
  }, [catalogInitialFilters]);

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 220);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Load categories & curated sections
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [catRes, mostRes, featRes, recRes] = await Promise.all([
          catalogFetch<{ success: boolean; categories: ServiceCategoryNode[] }>('/api/service-categories', {}, currentUser),
          catalogFetch<{ success: boolean; items: CatalogService[] }>('/api/services?section=most_requested&pageSize=3', {}, currentUser),
          catalogFetch<{ success: boolean; items: CatalogService[] }>('/api/services?section=featured&pageSize=3', {}, currentUser),
          catalogFetch<{ success: boolean; items: CatalogService[] }>('/api/services?section=recommended&pageSize=3', {}, currentUser),
        ]);
        if (!active) return;
        setCategories(catRes.categories || []);
        setMostRequested(mostRes.items || []);
        setFeaturedServices(featRes.items || []);
        setRecommendedServices(recRes.items || []);
      } catch {
        // handled cleanly below if main query fails
      }
    })();
    return () => {
      active = false;
    };
  }, [currentUser.id, catalogRefreshTick]);

  // Load filtered, sorted, paginated services
  const loadServices = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const qs = new URLSearchParams();
      if (debouncedQuery.trim()) qs.set('q', debouncedQuery.trim());
      if (selectedCategoryId) qs.set('categoryId', selectedCategoryId);
      if (selectedSubcategoryId) qs.set('subcategoryId', selectedSubcategoryId);
      if (selectedProviderId) qs.set('providerId', selectedProviderId);
      if (minPrice) qs.set('minPrice', minPrice);
      if (maxPrice) qs.set('maxPrice', maxPrice);
      if (minRating) qs.set('minRating', minRating);
      if (maxDays) qs.set('maxDays', maxDays);
      if (deliveryMode !== 'all') qs.set('deliveryMode', deliveryMode);
      if (verifiedOnly) qs.set('verifiedOnly', 'true');
      qs.set('sort', sortBy);
      qs.set('page', String(page));
      qs.set('pageSize', '9');

      const res = await catalogFetch<{
        success: boolean;
        items: CatalogService[];
        total: number;
        totalPages: number;
        favoriteIds: string[];
      }>(`/api/services?${qs.toString()}`, {}, currentUser);

      setItems(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      setFavoriteIds(res.favoriteIds || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'تعذر تحميل الخدمات الاستشارية حالياً.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [
    debouncedQuery,
    selectedCategoryId,
    selectedSubcategoryId,
    selectedProviderId,
    minPrice,
    maxPrice,
    minRating,
    maxDays,
    deliveryMode,
    verifiedOnly,
    sortBy,
    page,
    currentUser.id,
    catalogRefreshTick,
  ]);

  const handleToggleFavorite = async (serviceId: string) => {
    try {
      const res = await catalogFetch<{ success: boolean; favoriteIds: string[] }>(
        `/api/services/${encodeURIComponent(serviceId)}/favorite`,
        { method: 'POST' },
        currentUser
      );
      setFavoriteIds(res.favoriteIds || []);
    } catch {
      // ignore silently
    }
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedCategoryId('');
    setSelectedSubcategoryId('');
    setSelectedProviderId('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setMaxDays('');
    setDeliveryMode('all');
    setVerifiedOnly(false);
    setSortBy('most_requested');
    setPage(1);
  };

  const activeCategoryObj = categories.find((c) => c.id === selectedCategoryId);
  const activeProviderObj = selectedProviderId
    ? consultants.find((c) => c.id === selectedProviderId)
    : undefined;

  const hasActiveFilters = Boolean(
    debouncedQuery ||
      selectedCategoryId ||
      selectedSubcategoryId ||
      selectedProviderId ||
      minPrice ||
      maxPrice ||
      minRating ||
      maxDays ||
      deliveryMode !== 'all' ||
      verifiedOnly
  );

  const visibleCategories = showAllCategories ? categories : categories.slice(0, 9);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-right space-y-10">
      {/* 1. Editorial Hero Header */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-300">
            <Layers className="w-4 h-4" />
            <span>كتالوج الخدمات الاستشارية — WASEET Consulting Catalog</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black leading-tight">
            اكتشف الخدمة الاستشارية المناسبة لك
          </h1>
          <p className="text-sm text-blue-100/90 leading-relaxed max-w-2xl">
            تصفح مئات الخدمات الاستشارية الجاهزة بأسعار واضحة بالجنيه المصري، ومخرجات محددة، ومدة تنفيذ دقيقة من نخبة المستشارين المعتمدين في مصر.
          </p>

          {/* Smart Search Input */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 rtl:right-3.5 ltr:left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن خدمة (مثال: فحص ضريبي، تأسيس شركة، دراسة جدوى، اسم مستشار...)"
                className="w-full bg-white text-slate-900 text-xs sm:text-sm rounded-xl py-3 px-10 shadow-md focus:outline-hidden focus:ring-2 focus:ring-teal-400"
                data-testid="catalog-search-input"
              />
            </div>

            <button
              type="button"
              onClick={() => catalogGridRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="px-5 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer whitespace-nowrap"
            >
              تصفح جميع الخدمات ({total})
            </button>

            <button
              type="button"
              onClick={() => navigateToConsultantDirectoryWithService(selectedCategoryId)}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Users className="w-4 h-4 text-teal-300" />
              <span>دليل المستشارين</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Categories & Subcategories Explorer (18 Main Categories) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              التصنيفات الاستشارية ({categories.length} تصنيفاً رئيسياً)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              اختر مجال الخدمة لعرض التصنيفات الفرعية والخدمات المتخصصة فيه
            </p>
          </div>

          {categories.length > 9 && (
            <button
              type="button"
              onClick={() => setShowAllCategories((p) => !p)}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>{showAllCategories ? 'عرض تصنيفات أقل' : `عرض جميع التصنيفات (${categories.length})`}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAllCategories ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
          <button
            type="button"
            onClick={() => {
              setSelectedCategoryId('');
              setSelectedSubcategoryId('');
              setPage(1);
            }}
            className={`p-3 rounded-xl border text-right transition cursor-pointer ${
              !selectedCategoryId
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
            }`}
          >
            <span className="text-xs font-bold block">جميع الخدمات</span>
            <span className={`text-[11px] block mt-0.5 ${!selectedCategoryId ? 'text-blue-100' : 'text-slate-400'}`}>
              كافة التخصصات
            </span>
          </button>

          {visibleCategories.map((cat) => {
            const isActive = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategoryId(isActive ? '' : cat.id);
                  setSelectedSubcategoryId('');
                  setPage(1);
                }}
                className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
                }`}
              >
                <span className="text-xs font-bold block line-clamp-1">
                  {lang === 'ar' ? cat.nameAr : cat.nameEn}
                </span>
                <div className={`flex items-center justify-between text-[10px] mt-1 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                  <span>{cat.serviceCount ?? 0} خدمة</span>
                  {cat.requiresLicense && <span>ترخيص معتمد</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Subcategories Bar when a Main Category is selected */}
        {activeCategoryObj && activeCategoryObj.subcategories.length > 0 && (
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-blue-900 ml-2">
              التصنيفات الفرعية في {activeCategoryObj.nameAr}:
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedSubcategoryId('');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                !selectedSubcategoryId
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              الكل
            </button>
            {activeCategoryObj.subcategories.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  setSelectedSubcategoryId(selectedSubcategoryId === sub.id ? '' : sub.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                  selectedSubcategoryId === sub.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-700 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                {lang === 'ar' ? sub.nameAr : sub.nameEn}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 3. Curated Sections (Visible when browsing full unfiltered catalog on page 1) */}
      {!hasActiveFilters && page === 1 && mostRequested.length > 0 && (
        <section className="space-y-8">
          {/* Most Requested */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">الخدمات الأكثر طلباً</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSortBy('most_requested');
                  catalogGridRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>استعراض الكل</span>
                {lang === 'ar' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mostRequested.map((srv) => (
                <ServiceCard
                  key={`mr-${srv.id}`}
                  service={srv}
                  isFavorited={favoriteIds.includes(srv.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={navigateToService}
                  onOrderService={setServiceOrderModalService}
                />
              ))}
            </div>
          </div>

          {/* Featured & Recommended Strip */}
          {featuredServices.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">خدمات مميزة</h3>
                </div>
                <div className="space-y-2.5">
                  {featuredServices.map((srv) => (
                    <div
                      key={`feat-${srv.id}`}
                      onClick={() => navigateToService(srv.id)}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/30 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={srv.imageUrl}
                          alt={srv.titleAr}
                          className="w-12 h-12 rounded-lg object-cover shrink-0 bg-slate-100"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{srv.titleAr}</h4>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {srv.providerName} • {srv.executionDays} أيام
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-blue-700 shrink-0">
                        {srv.priceEgp.toLocaleString('ar-EG')} ج.م
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">خدمات موصى بها</h3>
                </div>
                <div className="space-y-2.5">
                  {recommendedServices.map((srv) => (
                    <div
                      key={`rec-${srv.id}`}
                      onClick={() => navigateToService(srv.id)}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-teal-300 hover:bg-teal-50/30 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={srv.imageUrl}
                          alt={srv.titleAr}
                          className="w-12 h-12 rounded-lg object-cover shrink-0 bg-slate-100"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{srv.titleAr}</h4>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {srv.categoryNameAr} • تقييم {srv.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-teal-700 shrink-0">
                        {srv.priceEgp.toLocaleString('ar-EG')} ج.م
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 4. Main Catalog Filter Bar & Results Grid */}
      <section ref={catalogGridRef} className="space-y-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                تصفح كافة الخدمات الاستشارية
              </h2>
              <p className="text-xs text-slate-500">
                النتائج المتاحة: <strong className="text-slate-800">{total}</strong> خدمة استشارية معتمدة
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Sort Selector */}
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setPage(1);
                }}
                aria-label="الترتيب حسب"
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 cursor-pointer"
              >
                <option value="most_requested">الترتيب: الأكثر طلباً</option>
                <option value="newest">الترتيب: الأحدث</option>
                <option value="rating">الترتيب: الأعلى تقييماً</option>
                <option value="price_asc">السعر: من الأقل للأعلى</option>
                <option value="price_desc">السعر: من الأعلى للأقل</option>
              </select>

              <button
                type="button"
                onClick={() => setShowAdvancedFilters((p) => !p)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                <span>فلاتر متقدمة</span>
              </button>
            </div>
          </div>

          {/* Primary Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            <select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setSelectedSubcategoryId('');
                setPage(1);
              }}
              aria-label="تصفية حسب التصنيف"
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 cursor-pointer"
            >
              <option value="">كل التصنيفات (18)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameAr}
                </option>
              ))}
            </select>

            <select
              value={deliveryMode}
              onChange={(e) => {
                setDeliveryMode(e.target.value as any);
                setPage(1);
              }}
              aria-label="طريقة تقديم الخدمة"
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 cursor-pointer"
            >
              <option value="all">طريقة التقديم: الكل</option>
              <option value="online">أونلاين عن بُعد</option>
              <option value="in_person">حضوري بمقر المستشار</option>
              <option value="both">أونلاين أو حضوري</option>
            </select>

            <select
              value={maxDays}
              onChange={(e) => {
                setMaxDays(e.target.value);
                setPage(1);
              }}
              aria-label="مدة التنفيذ القصوى"
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 cursor-pointer"
            >
              <option value="">مدة التنفيذ: الكل</option>
              <option value="2">تنفيذ سريع (حتى يومين)</option>
              <option value="3">حتى 3 أيام</option>
              <option value="5">حتى 5 أيام</option>
              <option value="7">حتى أسبوع</option>
            </select>

            <select
              value={selectedProviderId}
              onChange={(e) => {
                setSelectedProviderId(e.target.value);
                setPage(1);
              }}
              aria-label="تصفية حسب مقدم الخدمة"
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 cursor-pointer"
            >
              <option value="">جميع المستشارين المعتمدين</option>
              {consultants.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Expandable Advanced Filters */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">الحد الأدنى للسعر (ج.م)</label>
                <input
                  type="number"
                  min={0}
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setPage(1);
                  }}
                  placeholder="مثال: 1000"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">الحد الأقصى للسعر (ج.م)</label>
                <input
                  type="number"
                  min={0}
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setPage(1);
                  }}
                  placeholder="مثال: 5000"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">الحد الأدنى للتقييم</label>
                <select
                  value={minRating}
                  onChange={(e) => {
                    setMinRating(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                >
                  <option value="">جميع التقييمات</option>
                  <option value="4.9">4.9 نجوم فأعلى</option>
                  <option value="4.8">4.8 نجوم فأعلى</option>
                  <option value="4.5">4.5 نجوم فأعلى</option>
                </select>
              </div>

              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => {
                      setVerifiedOnly(e.target.checked);
                      setPage(1);
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                    مقدم خدمة موثق فقط
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Active Filters Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              {activeProviderObj && (
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 px-3 py-1 rounded-lg font-bold border border-blue-200">
                  <span>خدمات: {activeProviderObj.nameAr}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedProviderId('')}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>إعادة تعيين جميع الفلاتر</span>
              </button>
            </div>
          )}
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="catalog-loading">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                  <div className="h-9 bg-slate-200 rounded-xl w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && errorMsg && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="text-base font-bold text-rose-900">{errorMsg}</h3>
            <button
              type="button"
              onClick={loadServices}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !errorMsg && items.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
            <SlidersHorizontal className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">لم يتم العثور على خدمات مطابقة لمعايير البحث</h3>
            <p className="text-xs text-slate-500">
              جرب تعديل كلمات البحث أو إزالة بعض الفلاتر لعرض المزيد من الخدمات المتاحة.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              عرض جميع الخدمات
            </button>
          </div>
        )}

        {/* Services Grid */}
        {!isLoading && !errorMsg && items.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="catalog-grid">
              {items.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isFavorited={favoriteIds.includes(service.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={navigateToService}
                  onOrderService={setServiceOrderModalService}
                  onOpenProvider={(cId) => {
                    const found = consultants.find((c) => c.id === cId);
                    if (found) setSelectedConsultant(found);
                  }}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <ChevronRight className="w-4 h-4 ltr:rotate-180" />
                  <span>السابق</span>
                </button>
                <span className="text-xs font-bold text-slate-600 px-3">
                  صفحة {page} من {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-4 h-4 ltr:rotate-180" />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
